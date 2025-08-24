import crossFetch from 'cross-fetch';
import { Contract } from '@ethersproject/contracts';
import { getAddress, isAddress } from '@ethersproject/address';
import { parseUnits } from '@ethersproject/units';
import { namehash, ensNormalize } from '@ethersproject/hash';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import { getSnapshots } from './utils/blockfinder';
import getProvider from './utils/provider';
import { signMessage, getBlockNumber } from './utils/web3';
import { getHash, verify } from './verify';
import gateways from './gateways.json';
import networks from './networks.json';
import voting from './voting';
import getDelegatesBySpace, { SNAPSHOT_SUBGRAPH_URL } from './utils/delegation';
import { validateAndParseAddress } from 'starknet';
import { multicall, Multicaller } from './multicall';

interface Options {
  url?: string;
  headers?: any;
}

interface Strategy {
  name: string;
  network?: string;
  params: any;
}

type DomainType = 'ens' | 'tld' | 'other-tld' | 'subdomain';

const MUTED_ERRORS = [
  // mute error from coinbase, when the subdomain is not found
  // most other resolvers just return an empty address
  'response not found during CCIP fetch',
  // mute error from missing offchain resolver (mostly for sepolia)
  'UNSUPPORTED_OPERATION'
];
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_ABI = [
  'function text(bytes32 node, string calldata key) external view returns (string memory)',
  'function resolver(bytes32 node) view returns (address)' // ENS registry ABI
];
const UD_MAPPING = {
  '146': {
    tlds: ['.sonic'],
    registryContract: '0xde1dadcf11a7447c3d093e97fdbd513f488ce3b4'
  }
};
const UD_REGISTRY_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address owner)'
];
const ENS_CHAIN_IDS = ['1', '11155111'];
const SHIBARIUM_CHAIN_IDS = ['109', '157'];
const SHIBARIUM_TLD = '.shib';
const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

const scoreApiHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

const DEFAULT_SCORE_API_URL = 'https://score.snapshot.org';

function formatScoreAPIUrl(
  url = DEFAULT_SCORE_API_URL,
  options = {
    path: ''
  }
) {
  const scoreURL = new URL(url);
  if (options.path) scoreURL.pathname = options.path;
  const apiKey = scoreURL.searchParams.get('apiKey');
  let headers: any = { ...scoreApiHeaders };
  if (apiKey) {
    scoreURL.searchParams.delete('apiKey');
    headers = { ...scoreApiHeaders, 'X-API-KEY': apiKey };
  }
  return {
    url: scoreURL.toString(),
    headers
  };
}

async function parseScoreAPIResponse(res: any) {
  let data: any = await res.text();
  try {
    data = JSON.parse(data);
  } catch (e: any) {
    return Promise.reject({
      code: res.status || 500,
      message: 'Failed to parse response from score API',
      data
    });
  }
  if (data.error) return Promise.reject(data.error);
  return data;
}

const ajv = new Ajv({
  allErrors: true,
  allowUnionTypes: true,
  $data: true,
  passContext: true
});
// @ts-ignore
addFormats(ajv);
addErrors(ajv);

ajv.addFormat('address', {
  validate: (value: string) => {
    try {
      return value === getAddress(value);
    } catch (e: any) {
      return false;
    }
  }
});

ajv.addFormat('evmAddress', {
  validate: (value: string) => {
    try {
      getAddress(value);
      return true;
    } catch (e: any) {
      return false;
    }
  }
});

ajv.addFormat('starknetAddress', {
  validate: (value: string) => {
    try {
      // Accept both checksum and lowercase addresses
      // but need to always be padded
      return (
        validateAndParseAddress(value).toLowerCase() === value.toLowerCase()
      );
    } catch (e: any) {
      return false;
    }
  }
});

ajv.addFormat('long', {
  validate: () => true
});

ajv.addFormat('lowercase', {
  validate: (value: string) => value === value.toLowerCase()
});

ajv.addFormat('color', {
  validate: (value: string) => {
    if (!value) return false;
    return !!value.match(/^#[0-9A-F]{6}$/);
  }
});

ajv.addFormat('ethValue', {
  validate: (value: string) => {
    if (!value.match(/^([0-9]|[1-9][0-9]+)(\.[0-9]+)?$/)) return false;

    try {
      parseUnits(value, 18);
      return true;
    } catch {
      return false;
    }
  }
});

const networksIds = Object.keys(networks);
const mainnetNetworkIds = Object.keys(networks).filter(
  (id) => !networks[id].testnet
);

ajv.addKeyword({
  keyword: 'snapshotNetwork',
  validate: function (schema, data) {
    // @ts-ignore
    const snapshotEnv = this.snapshotEnv || 'default';
    if (snapshotEnv === 'mainnet') return mainnetNetworkIds.includes(data);
    return networksIds.includes(data);
  },
  error: {
    message: 'network not allowed'
  }
});

// Custom URL format to allow empty string values
// https://github.com/snapshot-labs/snapshot.js/pull/541/files
ajv.addFormat('customUrl', {
  type: 'string',
  validate: (str) => {
    if (!str.length) return true;
    return (
      str.startsWith('http://') ||
      str.startsWith('https://') ||
      str.startsWith('ipfs://') ||
      str.startsWith('ipns://') ||
      str.startsWith('snapshot://')
    );
  }
});

ajv.addFormat('domain', {
  validate: (value: string) => {
    if (!value) return false;
    return !!value.match(
      /^(https:\/\/)?([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}(\/)?$/
    );
  }
});

function getDomainType(domain: string): DomainType {
  const isEns = domain.endsWith('.eth');

  const tokens = domain.split('.');

  if (tokens.length === 1) return 'tld';
  else if (tokens.length === 2 && !isEns) return 'other-tld';
  else if (tokens.length > 2) return 'subdomain';
  else if (isEns) return 'ens';
  else throw new Error('Invalid domain');
}

// see https://docs.ens.domains/registry/dns#gasless-import
async function getDNSOwner(domain: string): Promise<string> {
  const response = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${domain}&type=TXT`,
    {
      headers: {
        accept: 'application/dns-json'
      }
    }
  );

  const data = await response.json();
  // Error list: https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-6
  if (data.Status === 3) return EMPTY_ADDRESS;
  if (data.Status !== 0) throw new Error('Failed to fetch DNS Owner');

  const ownerRecord = data.Answer?.find((record: any) =>
    record.data.includes('ENS1')
  );

  if (!ownerRecord) return EMPTY_ADDRESS;

  return getAddress(
    ownerRecord.data.replace(new RegExp('"', 'g'), '').split(' ').pop()
  );
}

export async function call(provider, abi: any[], call: any[], options?) {
  const contract = new Contract(call[0], abi, provider);
  try {
    const params = call[2] || [];
    return await contract[call[1]](...params, options || {});
  } catch (e: any) {
    return Promise.reject(e);
  }
}
export async function subgraphRequest(url: string, query, options: any = {}) {
  const body: Record<string, any> = { query: jsonToGraphQLQuery({ query }) };
  if (options.variables) body.variables = options.variables;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers
    },
    body: JSON.stringify(body)
  });
  let responseData: any = await res.text();
  try {
    responseData = JSON.parse(responseData);
  } catch (e: any) {
    throw new Error(
      `Errors found in subgraphRequest: URL: ${url}, Status: ${
        res.status
      }, Response: ${responseData.substring(0, 400)}`
    );
  }
  if (responseData.errors) {
    throw new Error(
      `Errors found in subgraphRequest: URL: ${url}, Status: ${
        res.status
      },  Response: ${JSON.stringify(responseData.errors).substring(0, 400)}`
    );
  }
  const { data } = responseData;
  return data || {};
}

export function getUrl(uri, gateway = gateways[0]) {
  const ipfsGateway = `https://${gateway}`;
  if (!uri) return null;
  if (
    !uri.startsWith('ipfs://') &&
    !uri.startsWith('ipns://') &&
    !uri.startsWith('https://') &&
    !uri.startsWith('http://')
  )
    return `${ipfsGateway}/ipfs/${uri}`;
  const uriScheme = uri.split('://')[0];
  if (uriScheme === 'ipfs')
    return uri.replace('ipfs://', `${ipfsGateway}/ipfs/`);
  if (uriScheme === 'ipns')
    return uri.replace('ipns://', `${ipfsGateway}/ipns/`);
  return uri;
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Enhanced fetch with timeout support - drop-in replacement for native fetch
 *
 * @param url - The URL to fetch
 * @param options - Fetch options with optional timeout
 * @param options.timeout - Request timeout in milliseconds (default: 30000ms). Set to 0 to disable timeout.
 *
 * @returns Promise that resolves to the Response object
 *
 * @throws {Error} Throws timeout error if request exceeds the specified timeout duration
 *
 * @example
 * ```typescript
 * // Uses default 30s timeout
 * const response = await fetch('https://api.example.com/data');
 *
 * // Custom 5s timeout
 * const response = await fetch('https://api.example.com/data', { timeout: 5000 });
 *
 * // Disable timeout
 * const response = await fetch('https://api.example.com/data', { timeout: 0 });
 *
 * // With additional fetch options
 * const response = await fetch('https://api.example.com/data', {
 *   timeout: 10000,
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ key: 'value' })
 * });
 * ```
 */
export async function fetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  if (timeout > 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await crossFetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signal, ...cleanFetchOptions } = fetchOptions;
  return crossFetch(url, cleanFetchOptions);
}

export async function getJSON(uri, options: any = {}) {
  const url = getUrl(uri, options.gateways);
  const response = await fetch(url, options);
  return response.json();
}

export async function ipfsGet(
  gateway: string,
  ipfsHash: string,
  protocolType = 'ipfs'
) {
  const url = `https://${gateway}/${protocolType}/${ipfsHash}`;
  return fetch(url).then((res) => res.json());
}

export async function sendTransaction(
  web3,
  contractAddress: string,
  abi: any[],
  action: string,
  params: any[],
  overrides = {}
) {
  const signer = web3.getSigner();
  const contract = new Contract(contractAddress, abi, web3);
  const contractWithSigner = contract.connect(signer);
  // overrides.gasLimit = 12e6;
  return await contractWithSigner[action](...params, overrides);
}

export async function getScores(
  space: string,
  strategies: Strategy[],
  network: string,
  addresses: string[],
  snapshot: number | string = 'latest',
  scoreApiUrl = DEFAULT_SCORE_API_URL,
  options: any = {}
) {
  if (!Array.isArray(addresses)) {
    return inputError('addresses should be an array of addresses');
  }
  if (addresses.length === 0) {
    return inputError('addresses can not be empty');
  }
  const invalidAddress = addresses.find((address) => !isValidAddress(address));
  if (invalidAddress) {
    return inputError(`Invalid address: ${invalidAddress}`);
  }
  if (!isValidNetwork(network)) {
    return inputError(`Invalid network: ${network}`);
  }
  const invalidStrategy = strategies.find(
    (strategy) => strategy.network && !isValidNetwork(strategy.network)
  );
  if (invalidStrategy) {
    return inputError(
      `Invalid network (${invalidStrategy.network}) in strategy ${invalidStrategy.name}`
    );
  }
  if (!isValidSnapshot(snapshot, network)) {
    return inputError(
      `Snapshot (${snapshot}) must be 'latest' or greater than network start block (${networks[network].start})`
    );
  }

  const urlObject = new URL(scoreApiUrl);
  urlObject.pathname = '/api/scores';
  const { url, headers } = formatScoreAPIUrl(scoreApiUrl, {
    path: '/api/scores'
  });

  try {
    const params = {
      space,
      network,
      snapshot,
      strategies,
      addresses
    };
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ params })
    });
    const response = await parseScoreAPIResponse(res);

    return options.returnValue === 'all'
      ? response.result
      : response.result[options.returnValue || 'scores'];
  } catch (e: any) {
    if (e.errno) {
      return Promise.reject({ code: e.errno, message: e.toString(), data: '' });
    }
    return Promise.reject(e);
  }
}

export async function getVp(
  address: string,
  network: string,
  strategies: Strategy[],
  snapshot: number | 'latest',
  space: string,
  delegation: false, // @deprecated - kept for backward compatibility for integrators using this function, no longer sent to API
  options?: Options
) {
  const { url, headers } = formatScoreAPIUrl(options?.url);
  if (!isValidAddress(address)) {
    return inputError(`Invalid voter address: ${address}`);
  }
  if (!isValidNetwork(network)) {
    return inputError(`Invalid network: ${network}`);
  }
  const invalidStrategy = strategies.find(
    (strategy) => strategy.network && !isValidNetwork(strategy.network)
  );

  if (invalidStrategy) {
    return inputError(
      `Invalid network (${invalidStrategy.network}) in strategy ${invalidStrategy.name}`
    );
  }
  if (!isValidSnapshot(snapshot, network)) {
    return inputError(
      `Snapshot (${snapshot}) must be 'latest' or greater than network start block (${networks[network].start})`
    );
  }

  const init = {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'get_vp',
      params: {
        address,
        network,
        strategies,
        snapshot,
        space
      }
    })
  };

  try {
    const res = await fetch(url, init);
    const response = await parseScoreAPIResponse(res);
    return response.result;
  } catch (e: any) {
    if (e.errno) {
      return Promise.reject({ code: e.errno, message: e.toString(), data: '' });
    }
    return Promise.reject(e);
  }
}

export async function validate(
  validation: string,
  author: string,
  space: string,
  network: string,
  snapshot: number | 'latest',
  params: any,
  options?: Options
) {
  if (!isValidAddress(author)) {
    return inputError(`Invalid author: ${author}`);
  }

  if (!isValidNetwork(network)) {
    return inputError(`Invalid network: ${network}`);
  }
  if (!isValidSnapshot(snapshot, network)) {
    return inputError(
      `Snapshot (${snapshot}) must be 'latest' or greater than network start block (${networks[network].start})`
    );
  }

  if (!options) options = {};
  const { url, headers } = formatScoreAPIUrl(options.url);

  const init = {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'validate',
      params: {
        validation,
        author,
        space,
        network,
        snapshot,
        params
      }
    })
  };

  try {
    const res = await fetch(url, init);
    const response = await parseScoreAPIResponse(res);
    return response.result;
  } catch (e: any) {
    if (e.errno) {
      return Promise.reject({ code: e.errno, message: e.toString(), data: '' });
    }
    return Promise.reject(e);
  }
}

interface validateSchemaOptions {
  snapshotEnv?: string;
  spaceType?: string;
}

export function validateSchema(
  schema,
  data,
  options: validateSchemaOptions = {
    snapshotEnv: 'default',
    spaceType: 'default'
  }
) {
  const ajvValidate = ajv.compile(schema);
  const valid = ajvValidate.call(options, data);
  return valid ? valid : ajvValidate.errors;
}

export async function getEnsTextRecord(
  ens: string,
  record: string,
  network = '1',
  options: any = {}
) {
  const {
    ensResolvers = networks[network]?.ensResolvers ||
      networks['1'].ensResolvers,
    broviderUrl,
    ...multicallOptions
  } = options;

  let ensHash: string;

  try {
    ensHash = namehash(ensNormalize(ens));
  } catch (e: any) {
    return null;
  }

  const provider = getProvider(network, { broviderUrl });

  const calls = [
    [ENS_REGISTRY, 'resolver', [ensHash]], // Query for resolver from registry
    ...ensResolvers.map((address: string) => [
      address,
      'text',
      [ensHash, record]
    ]) // Query for text record from each resolver
  ];

  const [[resolverAddress], ...textRecords] = (await multicall(
    network,
    provider,
    ENS_ABI,
    calls,
    multicallOptions
  )) as string[][];

  const resolverIndex = ensResolvers.indexOf(resolverAddress);
  return resolverIndex !== -1 ? textRecords[resolverIndex]?.[0] : null;
}

export async function getSpaceUri(
  id: string,
  network = '1',
  options: any = {}
): Promise<string | null> {
  try {
    return await getEnsTextRecord(id, 'snapshot', network, options);
  } catch (e: any) {
    console.log(e);
    return null;
  }
}

export async function getEnsOwner(
  ens: string,
  network = '1',
  options: any = {}
): Promise<string> {
  if (!networks[network]?.ensResolvers?.length) {
    throw new Error('Network not supported');
  }

  const domainType = getDomainType(ens);
  const provider = getProvider(network, options);
  const ensRegistry = new Contract(
    ENS_REGISTRY,
    ['function owner(bytes32) view returns (address)'],
    provider
  );

  let ensHash: string;

  try {
    ensHash = namehash(ensNormalize(ens));
  } catch (e: any) {
    return EMPTY_ADDRESS;
  }

  const ensNameWrapper =
    options.ensNameWrapper || networks[network].ensNameWrapper;
  let owner = await ensRegistry.owner(ensHash);
  // If owner is the ENSNameWrapper contract, resolve the owner of the name
  if (owner === ensNameWrapper) {
    const ensNameWrapperContract = new Contract(
      ensNameWrapper,
      ['function ownerOf(uint256) view returns (address)'],
      provider
    );
    owner = await ensNameWrapperContract.ownerOf(ensHash);
  }

  if (owner === EMPTY_ADDRESS && domainType === 'other-tld') {
    const resolvedAddress = await provider.resolveName(ens);

    // Filter out domains with valid TXT records, but not imported
    if (resolvedAddress) {
      owner = await getDNSOwner(ens);
    }
  }

  if (owner === EMPTY_ADDRESS && domainType === 'subdomain') {
    try {
      owner = await provider.resolveName(ens);
    } catch (e: any) {
      if (MUTED_ERRORS.every((error) => !e.message.includes(error))) {
        throw e;
      }
      owner = EMPTY_ADDRESS;
    }
  }

  return owner || EMPTY_ADDRESS;
}

async function getEnsSpaceController(
  id: string,
  network: string,
  options: any = {}
): Promise<string> {
  const spaceUri = await getSpaceUri(id, network, options);
  if (spaceUri) {
    let isUriAddress = isAddress(spaceUri);
    if (isUriAddress) return spaceUri;

    const uriParts = spaceUri.split('/');
    const position = uriParts.includes('testnet') ? 5 : 4;
    const address = uriParts[position];
    isUriAddress = isAddress(address);
    if (isUriAddress) return address;
  }
  return await getEnsOwner(id, network, options);
}

export async function getShibariumNameOwner(
  id: string,
  network: string
): Promise<string> {
  if (!id.endsWith(SHIBARIUM_TLD)) {
    return EMPTY_ADDRESS;
  }

  const response = await fetch('https://stamp.fyi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      method: 'get_owner',
      params: id,
      network
    })
  });

  const data = await response.json();
  return data.result;
}

export async function getUDNameOwner(
  id: string,
  network: string
): Promise<string> {
  const tlds = UD_MAPPING[network]?.tlds || [];
  if (!tlds.some((tld: string) => id.endsWith(tld))) {
    return Promise.resolve(EMPTY_ADDRESS);
  }

  try {
    const hash = namehash(ensNormalize(id));
    const tokenId = BigInt(hash);
    const provider = getProvider(network);

    return await call(
      provider,
      UD_REGISTRY_ABI,
      [UD_MAPPING[network].registryContract, 'ownerOf', [tokenId]],
      {
        blockTag: 'latest'
      }
    );
  } catch (e: any) {
    return EMPTY_ADDRESS;
  }
}

export async function getSpaceController(
  id: string,
  network = '1',
  options: any = {}
): Promise<string> {
  if (ENS_CHAIN_IDS.includes(network)) {
    return getEnsSpaceController(id, network, options);
  } else if (SHIBARIUM_CHAIN_IDS.includes(network)) {
    return getShibariumNameOwner(id, network);
  } else if (UD_MAPPING[String(network)]) {
    return getUDNameOwner(id, network);
  }

  throw new Error(`Network not supported: ${network}`);
}

export function clone(item) {
  return JSON.parse(JSON.stringify(item));
}

export async function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function getNumberWithOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function isValidNetwork(network: string) {
  return !!networks[network];
}

function isValidAddress(address: string) {
  return (
    address !== EMPTY_ADDRESS &&
    (isAddress(address) || isStarknetAddress(address))
  );
}

function isValidSnapshot(snapshot: number | string, network: string) {
  return (
    snapshot === 'latest' ||
    (typeof snapshot === 'number' && snapshot >= networks[network].start)
  );
}

export function isStarknetAddress(address: string): boolean {
  if (!address) return false;

  try {
    validateAndParseAddress(address);
    return true;
  } catch (e: any) {
    return false;
  }
}

export function isEvmAddress(address: string): boolean {
  return isAddress(address);
}

export function getFormattedAddress(
  address: string,
  format?: 'evm' | 'starknet'
): string {
  if (typeof address !== 'string' || !/^0[xX]/.test(address)) {
    throw new Error(`Invalid address: ${address}`);
  }

  const addressType = format ?? (address.length === 42 ? 'evm' : 'starknet');

  if (addressType === 'evm' && isEvmAddress(address))
    return getAddress(address);
  if (addressType === 'starknet' && isStarknetAddress(address))
    return validateAndParseAddress(address);

  throw new Error(`Invalid ${addressType} address: ${address}`);
}

function inputError(message: string) {
  return Promise.reject(new Error(message));
}

export { getDelegatesBySpace, SNAPSHOT_SUBGRAPH_URL };

export default {
  call,
  multicall,
  fetch,
  subgraphRequest,
  ipfsGet,
  getUrl,
  getJSON,
  sendTransaction,
  getScores,
  getVp,
  validateSchema,
  getEnsTextRecord,
  getSpaceUri,
  getEnsOwner,
  getSpaceController,
  getDelegatesBySpace,
  clone,
  sleep,
  getNumberWithOrdinal,
  voting,
  getProvider,
  signMessage,
  getBlockNumber,
  Multicaller,
  getSnapshots,
  getHash,
  verify,
  validate,
  isStarknetAddress,
  isEvmAddress,
  getFormattedAddress,
  SNAPSHOT_SUBGRAPH_URL
};
