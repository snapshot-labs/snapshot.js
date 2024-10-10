import fetch from 'cross-fetch';
import { Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { getAddress, isAddress } from '@ethersproject/address';
import { parseUnits } from '@ethersproject/units';
import { namehash, ensNormalize } from '@ethersproject/hash';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import Multicaller from './utils/multicaller';
import { getSnapshots } from './utils/blockfinder';
import getProvider from './utils/provider';
import { signMessage, getBlockNumber } from './utils/web3';
import { getHash, verify } from './verify';
import gateways from './gateways.json';
import networks from './networks.json';
import voting from './voting';
import getDelegatesBySpace, { SNAPSHOT_SUBGRAPH_URL } from './utils/delegation';
import { validateAndParseAddress } from 'starknet';

interface Options {
  url?: string;
  headers?: any;
}

interface Strategy {
  name: string;
  network?: string;
  params: any;
}

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_ABI = [
  'function text(bytes32 node, string calldata key) external view returns (string memory)',
  'function resolver(bytes32 node) view returns (address)' // ENS registry ABI
];
const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const STARKNET_NETWORKS = {
  '0x534e5f4d41494e': {
    name: 'Starknet',
    testnet: false
  },
  '0x534e5f5345504f4c4941': {
    name: 'Starknet Sepolia',
    testnet: true
  }
};

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
      return validateAndParseAddress(value) === value;
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

ajv.addKeyword({
  keyword: 'starknetNetwork',
  validate: function (schema, data) {
    // @ts-ignore
    const snapshotEnv = this.snapshotEnv || 'default';
    if (snapshotEnv === 'mainnet') {
      return Object.keys(STARKNET_NETWORKS)
        .filter((id) => !STARKNET_NETWORKS[id].testnet)
        .includes(data);
    }

    return Object.keys(STARKNET_NETWORKS).includes(data);
  },
  error: {
    message: 'network not allowed'
  }
});

ajv.addKeyword({
  keyword: 'maxLengthWithSpaceType',
  validate: function validate(schema, data) {
    // @ts-ignore
    const spaceType = this.spaceType || 'default';
    const isValid = data.length <= schema[spaceType];
    if (!isValid) {
      // @ts-ignore
      validate.errors = [
        {
          keyword: 'maxLengthWithSpaceType',
          message: `must not have more than ${schema[spaceType]}`,
          params: { limit: schema[spaceType] }
        }
      ];
    }
    return isValid;
  },
  errors: true
});

ajv.addKeyword({
  keyword: 'maxItemsWithSpaceType',
  validate: function validate(schema, data) {
    // @ts-ignore
    const spaceType = this.spaceType || 'default';
    const isValid = data.length <= schema[spaceType];
    if (!isValid) {
      // @ts-ignore
      validate.errors = [
        {
          keyword: 'maxItemsWithSpaceType',
          message: `must NOT have more than ${schema[spaceType]} items`,
          params: { limit: schema[spaceType] }
        }
      ];
    }
    return isValid;
  },
  errors: true
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

export async function call(provider, abi: any[], call: any[], options?) {
  const contract = new Contract(call[0], abi, provider);
  try {
    const params = call[2] || [];
    return await contract[call[1]](...params, options || {});
  } catch (e: any) {
    return Promise.reject(e);
  }
}

export async function multicall(
  network: string,
  provider,
  abi: any[],
  calls: any[],
  options?
) {
  const multicallAbi = [
    'function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)'
  ];
  const multicallAddress =
    options?.multicallAddress || networks[network].multicall;
  const multi = new Contract(multicallAddress, multicallAbi, provider);
  const itf = new Interface(abi);
  try {
    const max = options?.limit || 500;
    if (options?.limit) delete options.limit;
    const pages = Math.ceil(calls.length / max);
    const promises: any = [];
    Array.from(Array(pages)).forEach((x, i) => {
      const callsInPage = calls.slice(max * i, max * (i + 1));
      promises.push(
        multi.aggregate(
          callsInPage.map((call) => [
            call[0].toLowerCase(),
            itf.encodeFunctionData(call[1], call[2])
          ]),
          options || {}
        )
      );
    });
    let results: any = await Promise.all(promises);
    results = results.reduce((prev: any, [, res]: any) => prev.concat(res), []);
    return results.map((call, i) =>
      itf.decodeFunctionResult(calls[i][1], call)
    );
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

export async function getJSON(uri, options: any = {}) {
  const url = getUrl(uri, options.gateways);
  return fetch(url).then((res) => res.json());
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
  delegation: boolean,
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
        space,
        delegation
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

  const [[resolverAddress], ...textRecords]: string[][] = await multicall(
    network,
    provider,
    ENS_ABI,
    calls,
    multicallOptions
  );

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
): Promise<string | null> {
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
    return null;
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
  return owner;
}

export async function getSpaceController(
  id: string,
  network = '1',
  options: any = {}
): Promise<string | null> {
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
  return isAddress(address) && address !== EMPTY_ADDRESS;
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
  format: 'evm' | 'starknet'
): string {
  if (format === 'evm' && isEvmAddress(address)) return getAddress(address);
  if (format === 'starknet' && isStarknetAddress(address))
    return validateAndParseAddress(address);

  throw new Error(`Invalid address: ${address}`);
}

function inputError(message: string) {
  return Promise.reject(new Error(message));
}

export { getDelegatesBySpace, SNAPSHOT_SUBGRAPH_URL };

export default {
  call,
  multicall,
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
