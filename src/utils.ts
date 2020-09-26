import { Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import { abi as multicallAbi } from './abi/Multicall.json';
import _strategies from './strategies';

const MULTICALL = {
  1: '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
  4: '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821',
  5: '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e',
  6: '0x53c43764255c17bd724f74c4ef150724ac50a3ed',
  42: '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
  56: '0x1ee38d535d541c55c9dae27b12edf090c608e6fb',
  100: '0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a'
}

export async function multicall(network, provider, abi, calls, options?) {
  const multi = new Contract(MULTICALL[network], multicallAbi, provider);
  const itf = new Interface(abi);
  try {
    const [, response] = await multi.aggregate(
      calls.map(call => [
        call[0].toLowerCase(),
        itf.encodeFunctionData(call[1], call[2])
      ]),
      options || {}
    );
    return response.map((call, i) =>
      itf.decodeFunctionResult(calls[i][1], call)
    );
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

export async function getScores(strategies, network, provider, addresses, snapshot = 'latest') {
  return await Promise.all(
    strategies.map(strategy =>
      _strategies[strategy[0]](
        network,
        provider,
        addresses,
        strategy[1],
        snapshot
      )
    )
  );
}

export default {
  multicall,
  subgraphRequest,
  getScores
}
