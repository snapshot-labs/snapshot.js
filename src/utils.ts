import { Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import Ajv from 'ajv';
import { abi as multicallAbi } from './abi/Multicall.json';
import _strategies from './strategies';
const fetch = require("node-fetch");

export const MULTICALL = {
  '1': '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
  '4': '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821',
  '5': '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e',
  '6': '0x53c43764255c17bd724f74c4ef150724ac50a3ed',
  '42': '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
  '56': '0x1ee38d535d541c55c9dae27b12edf090c608e6fb',
  '97': '0x8b54247c6BAe96A6ccAFa468ebae96c4D7445e46',
  '100': '0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a',
  wanchain: '0xba5934ab3056fca1fa458d30fbb3810c3eb5145f'
};

export const SNAPSHOT_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot',
  '4': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-rinkeby',
  '42': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-kovan'
};

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
    return Promise.reject();
  }
}

export async function subgraphRequest(url: string, query) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: jsonToGraphQLQuery({ query }) })
  });
  const { data } = await res.json();
  return data || {};
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
  snapshot = 'latest'
) {
  return await Promise.all(
    strategies.map((strategy) =>
      _strategies[strategy.name](
        space,
        network,
        provider,
        addresses,
        strategy.params,
        snapshot
      )
    )
  );
}

export function validateSchema(schema, data) {
  const ajv = new Ajv();
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
  validateSchema
};
