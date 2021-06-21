import { Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { abi as multicallAbi } from './abi/Multicall.json';
import _strategies from './strategies';
import Multicaller from './utils/multicaller';
import getProvider from './utils/provider';
import {
  decodeContenthash,
  validateContent,
  isValidContenthash,
  encodeContenthash,
  resolveENSContentHash,
  resolveContent
} from './utils/contentHash';
import { signMessage, getBlockNumber } from './utils/web3';
import gateways from './gateways.json';

export const MULTICALL = {
  '1': '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
  '3': '0x53c43764255c17bd724f74c4ef150724ac50a3ed',
  '4': '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821',
  '5': '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e',
  '6': '0x53c43764255c17bd724f74c4ef150724ac50a3ed',
  '17': '0xB9cb900E526e7Ad32A2f26f1fF6Dee63350fcDc5',
  '30': '0x4eeebb5580769ba6d26bfd07be636300076d1831',
  '31': '0x4eeebb5580769ba6d26bfd07be636300076d1831',
  '42': '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
  '56': '0x1ee38d535d541c55c9dae27b12edf090c608e6fb',
  '70': '0xd4b794b89baccb70ef851830099bee4d69f19ebc',
  '65': '0x23Daae12B7f82b1f0A276cD4f49825DE940B6374',
  '66': '0x5031F781E294bD918CfCf5aB7fe57196DeAA7Efb',
  '82': '0x579De77CAEd0614e3b158cb738fcD5131B9719Ae',
  '97': '0x8b54247c6BAe96A6ccAFa468ebae96c4D7445e46',
  '100': '0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a',
  '128': '0x37ab26db3df780e7026f3e767f65efb739f48d8e',
  '137': '0xCBca837161be50EfA5925bB9Cc77406468e76751',
  '246': '0x0767F26d0D568aB61A98b279C0b28a4164A6f05e',
  '256': '0xC33994Eb943c61a8a59a918E2de65e03e4e385E0',
  '1287': '0xD7bA481DE7fB53A7a29641c43232B09e5D9CAe7b',
  '1337': '0x566131e85d46cc7BBd0ce5C6587E9912Dc27cDAc',
  '2109': '0x7E9985aE4C8248fdB07607648406a48C76e9e7eD',
  wanchain: '0xba5934ab3056fca1fa458d30fbb3810c3eb5145f',
  '250': '0x7f6A10218264a22B4309F3896745687E712962a0',
  '499': '0x7955FF653FfDBf13056FeAe227f655CfF5C194D5',
  '42220': '0xb8d0d2C1391eeB350d2Cd39EfABBaaEC297368D9',
  '4689': '0x9c8B105c94282CDB0F3ecF27e3cfA96A35c07be6',
  '4690': '0x30aE8783d26aBE7Fbb9d83549CCb7430AE4A301F',
  '1666600000': '0x9c31392D2e0229dC4Aa250F043d46B9E82074BF8',
  '1666700000': '0x9923589503Fd205feE3d367DDFF2378f0F7dD2d4'
};

export const SNAPSHOT_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot',
  '4': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-rinkeby',
  '42': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-kovan'
};

export const SNAPSHOT_SCORE_API = 'https://score.snapshot.org/api/scores';

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
  const multi = new Contract(MULTICALL[network], multicallAbi, provider);
  const itf = new Interface(abi);
  try {
    const [, res] = await multi.aggregate(
      calls.map((call) => [
        call[0].toLowerCase(),
        itf.encodeFunctionData(call[1], call[2])
      ]),
      options || {}
    );
    return res.map((call, i) => itf.decodeFunctionResult(calls[i][1], call));
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
  const { data } = await res.json();
  return data || {};
}

export function getUrl(uri) {
  const uriScheme = uri.split('://')[0];
  const ipfsGateway = `https://${gateways[0]}`;
  if (uriScheme === 'ipfs')
    return uri.replace('ipfs://', `${ipfsGateway}/ipfs/`);
  if (uriScheme === 'ipns')
    return uri.replace('ipns://', `${ipfsGateway}/ipns/`);
  return uri;
}

export async function ipfsGet(
  gateway: string,
  ipfsHash: string,
  protocolType: string = 'ipfs'
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
  provider,
  addresses: string[],
  snapshot: number | string = 'latest'
) {
  try {
    const params = {
      space,
      network,
      snapshot,
      strategies,
      addresses
    };
    const res = await fetch(SNAPSHOT_SCORE_API, {
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

export async function getScoresDirect(
  space: string,
  strategies: any[],
  network: string,
  provider,
  addresses: string[],
  snapshot: number | string = 'latest'
) {
  console.log('getScoresDirect');
  try {
    return await Promise.all(
      strategies.map((strategy) =>
        (snapshot !== 'latest' && strategy.params?.start > snapshot) ||
        (strategy.params?.end &&
          (snapshot === 'latest' || snapshot > strategy.params?.end)) ||
        addresses.length === 0
          ? {}
          : _strategies[strategy.name](
              space,
              network,
              provider,
              addresses,
              strategy.params,
              snapshot
            )
      )
    );
  } catch (e) {
    return Promise.reject(e);
  }
}

export function validateSchema(schema, data) {
  const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, $data: true });
  // @ts-ignore
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return valid ? valid : validate.errors;
}

export default {
  call,
  multicall,
  subgraphRequest,
  ipfsGet,
  sendTransaction,
  getScores,
  getScoresDirect,
  validateSchema,
  getProvider,
  decodeContenthash,
  validateContent,
  isValidContenthash,
  encodeContenthash,
  resolveENSContentHash,
  resolveContent,
  signMessage,
  getBlockNumber,
  Multicaller
};
