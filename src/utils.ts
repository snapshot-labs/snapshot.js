// import fetch from 'node-fetch';
import { Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import { abi as multicallAbi } from './abi/Multicall.json';
import _strategies from './strategies';

export const MULTICALL = {
  '1': '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
  '4': '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821',
  '5': '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e',
  '6': '0x53c43764255c17bd724f74c4ef150724ac50a3ed',
  '42': '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
  '56': '0x1ee38d535d541c55c9dae27b12edf090c608e6fb',
  '100': '0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a',
  'wanchain': '0xba5934ab3056fca1fa458d30fbb3810c3eb5145f'
};

export async function call(provider, abi, call, options?) {
  const contract = new Contract(call[0], abi, provider);
  try {
    return await contract[call[1]](...call[2], options || {});
  } catch (e) {
    return Promise.reject(e);
  }
}

export async function multicall(network, provider, abi, calls, options?) {
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

export async function subgraphRequest(url, query) {
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

export async function sendTransaction(
  web3,
  contractAddress,
  abi,
  action,
  params
) {
  const signer = web3.getSigner();
  const contract = new Contract(contractAddress, abi, web3);
  const contractWithSigner = contract.connect(signer);
  const overrides = {};
  // overrides.gasLimit = 12e6;
  return await contractWithSigner[action](...params, overrides);
}

export async function getScores(
  strategies,
  network,
  provider,
  addresses,
  snapshot = 'latest'
) {
  return await Promise.all(
    strategies.map((strategy) =>
      _strategies[strategy.name](
        network,
        provider,
        addresses,
        strategy.params,
        snapshot
      )
    )
  );
}

export default {
  call,
  multicall,
  subgraphRequest,
  sendTransaction,
  getScores
};
