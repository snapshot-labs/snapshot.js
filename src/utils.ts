import fetch from 'cross-fetch';
import { Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { isAddress } from '@ethersproject/address';
import { parseUnits } from '@ethersproject/units';
import { namehash, ensNormalize } from '@ethersproject/hash';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import Multicaller from './utils/multicaller';
import { getSnapshots } from './utils/blockfinder';
import getProvider from './utils/provider';
import { signMessage, getBlockNumber } from './utils/web3';
import { getHash, verify } from './sign/utils';
import gateways from './gateways.json';
import networks from './networks.json';
import delegationSubgraphs from './delegationSubgraphs.json';
import voting from './voting';

interface Options {
  url?: string;
}

interface Strategy {
  name: string;
  network?: string;
  params: any;
}

export const SNAPSHOT_SUBGRAPH_URL = delegationSubgraphs;
const ENS_RESOLVER_ABI = [
  'function text(bytes32 node, string calldata key) external view returns (string memory)'
];

const scoreApiHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, $data: true });
// @ts-ignore
addFormats(ajv);

ajv.addFormat('address', {
  validate: (value: string) => {
    try {
      return isAddress(value);
    } catch (err) {
      return false;
    }
  }
});

ajv.addFormat('long', {
  validate: () => true
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
  } catch (e) {
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
  } catch (e) {
    return Promise.reject(e);
  }
}

export async function subgraphRequest(url: string, query, options: any = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers
    },
    body: JSON.stringify({ query: jsonToGraphQLQuery({ query }) })
  });
  let responseData: any = await res.text();
  try {
    responseData = JSON.parse(responseData);
  } catch (e) {
    throw new Error(
      `Errors found in subgraphRequest: URL: ${url}, Status: ${res.status}, Response: ${responseData}`
    );
  }
  if (responseData.errors) {
    throw new Error(
      `Errors found in subgraphRequest: URL: ${url}, Status: ${
        res.status
      },  Response: ${JSON.stringify(responseData.errors)}`
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
  scoreApiUrl = 'https://score.snapshot.org',
  options: any = {}
) {
  const url = new URL(scoreApiUrl);
  url.pathname = '/api/scores';
  scoreApiUrl = url.toString();

  try {
    const params = {
      space,
      network,
      snapshot,
      strategies,
      addresses
    };
    const res = await fetch(scoreApiUrl, {
      method: 'POST',
      headers: scoreApiHeaders,
      body: JSON.stringify({ params })
    });
    const obj = await res.json();
    return options.returnValue === 'all'
      ? obj.result
      : obj.result[options.returnValue || 'scores'];
  } catch (e) {
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
  if (!options) options = {};
  if (!options.url) options.url = 'https://score.snapshot.org';
  const init = {
    method: 'POST',
    headers: scoreApiHeaders,
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
  const res = await fetch(options.url, init);
  const json = await res.json();
  if (json.error) return Promise.reject(json.error);
  if (json.result) return json.result;
}

export async function validate(
  validation: string,
  author: string,
  space: string,
  network: string,
  snapshot: number | 'latest',
  params: any,
  options: any
) {
  if (!options) options = {};
  if (!options.url) options.url = 'https://score.snapshot.org';
  const init = {
    method: 'POST',
    headers: scoreApiHeaders,
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
  const res = await fetch(options.url, init);
  const json = await res.json();
  if (json.error) return Promise.reject(json.error);
  return json.result;
}

export function validateSchema(schema, data) {
  const ajvValidate = ajv.compile(schema);
  const valid = ajvValidate(data);
  return valid ? valid : ajvValidate.errors;
}

export async function getEnsTextRecord(
  ens: string,
  record: string,
  network = '1',
  options: any = {}
) {
  const {
    ensResolvers: ensResolversOpt,
    broviderUrl,
    ...multicallOptions
  } = options;
  const ensResolvers =
    ensResolversOpt ||
    networks[network].ensResolvers ||
    networks['1'].ensResolvers;
  const ensHash = namehash(ensNormalize(ens));
  const provider = getProvider(network, { broviderUrl });

  const result = await multicall(
    network,
    provider,
    ENS_RESOLVER_ABI,
    ensResolvers.map((address: any) => [address, 'text', [ensHash, record]]),
    multicallOptions
  );
  return result.flat().find((r: string) => r) || '';
}

export async function getSpaceUri(
  id: string,
  network = '1',
  options: any = {}
): Promise<string | null> {
  try {
    return await getEnsTextRecord(id, 'snapshot', network, options);
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function getEnsOwner(
  ens: string,
  network = '1',
  options: any = {}
): Promise<string | null> {
  const registryAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
  const provider = getProvider(network, options);
  const ensRegistry = new Contract(
    registryAddress,
    ['function owner(bytes32) view returns (address)'],
    provider
  );
  const ensNameWrapper =
    options.ensNameWrapper || networks[network].ensNameWrapper;
  const ensHash = namehash(ensNormalize(ens));
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

export async function getDelegatesBySpace(
  network: string,
  space: string,
  snapshot = 'latest',
  options: any = {}
) {
  const subgraphUrl =
    options.subgraphUrl || SNAPSHOT_SUBGRAPH_URL[network];
  if (!subgraphUrl) {
    return Promise.reject(
      `Delegation subgraph not available for network ${network}`
    );
  }
  const spaceIn = ['', space];
  if (space.includes('.eth')) spaceIn.push(space.replace('.eth', ''));

  const PAGE_SIZE = 1000;
  let result = [];
  let page = 0;
  const params: any = {
    delegations: {
      __args: {
        where: {
          space_in: spaceIn
        },
        first: PAGE_SIZE,
        skip: 0
      },
      delegator: true,
      space: true,
      delegate: true
    }
  };
  if (snapshot !== 'latest') {
    params.delegations.__args.block = { number: snapshot };
  }

  while (true) {
    params.delegations.__args.skip = page * PAGE_SIZE;

    const pageResult = await subgraphRequest(subgraphUrl, params);
    const pageDelegations = pageResult.delegations || [];
    result = result.concat(pageDelegations);
    page++;
    if (pageDelegations.length < PAGE_SIZE) break;
  }

  return result;
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
  SNAPSHOT_SUBGRAPH_URL
};
