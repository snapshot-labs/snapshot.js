import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { subgraphRequest } from '../../utils';

const BALANCER_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer'
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
  if (Object.keys(score).length === 0) return {};

  const poolQueryParams = {
    pools: {
      __args: {
        where: {
          id: options.pool
        }
      },
      tokens: {
        __args: {
          where: {
            address: options.governanceToken
          }
        },
        balance: true
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    poolQueryParams.pools.__args.block = { number: snapshot };
  }

  const result = await subgraphRequest(
    BALANCER_SUBGRAPH_URL[network],
    poolQueryParams
  );
  if (!result || !result.pools) return {};

  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);
  const poolTokenBalance = result.pools[0].tokens[0].balance;

  return Object.fromEntries(
    Object.entries(score).map((account) => [
      account[0],
      (account[1] / totalScore) * poolTokenBalance
    ])
  );
}
