import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'stalker474';
export const version = '0.1.0';

const UNISWAPV2_SUBGRAPH_URL = {
  1: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
};

export async function strategy(
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const params = {
    users: {
        __args: {
            where: {
                id_in : addresses.map((address) => address.toLowerCase())
            }
        },
        id : true,
        liquidityPositions: {
            __args: {
                where : {
                    pair : options.pair
                },
                first : 1
            },
            pair : {
                token0 : {
                    totalLiquidity : true
                },
                token1 : {
                    totalLiquidity : true
                },
                totalSupply : true
            },
            liquidityTokenBalance : true
        }
    }
  }
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.users.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(UNISWAPV2_SUBGRAPH_URL[network], params);
  const score = {};
  addresses.map(acc => {
    score[acc] = 0
  })
  if(result && result.users) {
    result.users.map(user => {
      if(user.liquidityPositions.length > 0) {
        const pool = user.liquidityPositions[0]
        const token = options.token === "1"? pool.pair.token1 : pool.pair.token0
        const tokenBalance = token.totalLiquidity * (pool.liquidityTokenBalance / pool.pair.totalSupply)
        score[user.id] = tokenBalance / token.totalLiquidity
      }
    })
  }
  return score || {}
}