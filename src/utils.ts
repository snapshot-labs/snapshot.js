import fetch from 'cross-fetch';
import { Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { hash, normalize } from '@ensdomains/eth-ens-namehash';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import Multicaller from './utils/multicaller';
import { getSnapshots } from './utils/blockfinder';
import getProvider from './utils/provider';
import validations from './validations';
import { signMessage, getBlockNumber } from './utils/web3';
import { getHash, verify } from './sign/utils';
import gateways from './gateways.json';
import networks from './networks.json';
import voting from './voting';

export const SNAPSHOT_SUBGRAPH_URL = {
  '1':
    'https://gateway.thegraph.com/api/0f15b42bdeff7a063a4e1757d7e2f99e/deployments/id/QmXvEzRJXby7KFuTr7NJsM47hGefM5VckEXZrQyZzL9eJd',
  '4': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-rinkeby',
  '42': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-kovan',
  '97':
    'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-binance-smart-chain',
  '100':
    'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-gnosis-chain',
  '137':
    'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-polygon',
  '250': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-fantom'
};

const ENS_RESOLVER_ABI = [
  'function text(bytes32 node, string calldata key) external view returns (string memory)'
];

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
  const multi = new Contract(
    networks[network].multicall,
    multicallAbi,
    provider
  );
  const itf = new Interface(abi);
  try {
    const max = options?.limit || 500;
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
  const responseData = await res.json();
  if (responseData.errors) {
    throw new Error(
      'Errors found in subgraphRequest: ' +
        url +
        JSON.stringify(responseData.errors)
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

export async function getJSON(uri) {
  const url = getUrl(uri);
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
  strategies: any[],
  network: string,
  addresses: string[],
  snapshot: number | string = 'latest',
  scoreApiUrl = 'https://score.snapshot.org/api/scores'
) {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params })
    });
    const obj = await res.json();
    return obj.result.scores;
  } catch (e) {
    return Promise.reject(e);
  }
}

export function validateSchema(schema, data) {
  const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, $data: true });
  // @ts-ignore
  addFormats(ajv);

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

  const validate = ajv.compile(schema);
  const valid = validate(data);
  return valid ? valid : validate.errors;
}

export function getEnsTextRecord(ens: string, record: string, network = '1') {
  const address = networks[network].ensResolver || networks['1'].ensResolver;
  const ensHash = hash(normalize(ens));
  const provider = getProvider(network);
  return call(provider, ENS_RESOLVER_ABI, [address, 'text', [ensHash, record]]);
}

export async function getSpaceUri(id, network = '1') {
  try {
    return await getEnsTextRecord(id, 'snapshot', network);
  } catch (e) {
    console.log('getSpaceUriFromTextRecord failed', id, e);
  }
  return false;
}

export async function getDelegatesBySpace(
  network: string,
  space: string,
  snapshot = 'latest'
) {
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

    const pageResult = await subgraphRequest(
      SNAPSHOT_SUBGRAPH_URL[network],
      params
    );
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
  validateSchema,
  getEnsTextRecord,
  getSpaceUri,
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
  validations,
  getHash,
  verify,
  SNAPSHOT_SUBGRAPH_URL
};
