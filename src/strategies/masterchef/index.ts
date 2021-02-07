import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const MASTERCHEF_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/sushiswap/master-chef'
};

const SUSHISWAP_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange'
};

export const author = '0xKiwi';
export const version = '0.1.0';

export async function strategy(
  _space,
  network,
  _provider,
  address,
  options,
  snapshot
) {

  const masterchefParams = {
    pool: {
      __args: {
        where: {
          id_in: address.toLowerCase()
        },
        first: 1000
      },
      id: true,
      users: {
        __args: {
          where: {
            amount_gt: 0,
          },
        },
        id: true,
        amount: true,
      },
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.pool.__args.block = { number: snapshot };
  }
  const masterchefResult = await subgraphRequest(MASTERCHEF_SUBGRAPH_URL[network], masterchefParams);

  let stakedBalances = []
  if (masterchefResult && masterchefResult.pool) {
    stakedBalances = masterchefResult.pool.users.map((u) => {
      return {
        id: u.id,
        amount: u.amount,
      }
    })
  }

  const sushiParams = {
    pair: {
      __args: {
        where: {
          id_in: address.toLowerCase()
        },
        first: 1000
      },
      id: true,
      token0: {
        id: true
      },
      reserve0: true,
      token1: {
        id: true
      },
      reserve1: true,
      totalSupply: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.pair.__args.block = { number: snapshot };
  }
  const tokenAddress = options.address.toLowerCase();
  const sushiResult = await subgraphRequest(SUSHISWAP_SUBGRAPH_URL[network], sushiParams);
  const score = {};
  if (sushiResult && sushiResult.pair) {
    const token0perUni = sushiResult.pair.reserve0 / sushiResult.pair.totalSupply;
    const token1perUni = sushiResult.pair.reserve1 / sushiResult.pair.totalSupply;
    stakedBalances.forEach((u) => {
      const userScore =
        sushiResult.pair.token0.id == tokenAddress
          ? token0perUni * u.amount
          : token1perUni * u.amount;

      const userAddress = getAddress(u.id);
      if (!score[userAddress]) score[userAddress] = 0;
      score[userAddress] = score[userAddress] + userScore;
    });
  }
  return score || {};
}
