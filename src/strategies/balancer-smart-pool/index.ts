import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { subgraphRequest } from '../../utils';

const BALANCER_SUBGRAPH_URL = {
  1: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer'
};


export const author = 'kibagateaux';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  const poolQueryParams = {
    pools: {
      __args: {
        where: {
          id: options.address
        }
      }
    },
    tokens: {
      __args: {
        where: {
          id: options.tokenAddress
        }
      },
      balance: true,
    }
  }
  const result = await subgraphRequest(BALANCER_SUBGRAPH_URL[network], {
    ...poolQueryParams,
  });
  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);
  const poolTokenBalance = result.pools.tokens[0].balance
  return Object.fromEntries(
    Object.entries(score).map((address, balance) => [
      address,
      (balance / totalScore) * poolTokenBalance
    ])
  );
}
