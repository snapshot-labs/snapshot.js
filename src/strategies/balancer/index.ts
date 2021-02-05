import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.0';

const BALANCER_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-beta',
  '42': 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan'
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const params = {
    poolShares: {
      __args: {
        where: {
          userAddress_in: addresses.map((address) => address.toLowerCase()),
          balance_gt: 0
        },
        first: 1000,
        orderBy: 'balance',
        orderDirection: 'desc'
      },
      userAddress: {
        id: true
      },
      balance: true,
      poolId: {
        totalShares: true,
        tokens: {
          id: true,
          balance: true
        }
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.poolShares.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(BALANCER_SUBGRAPH_URL[network], params);
  const score = {};
  if (result && result.poolShares) {
    result.poolShares.forEach((poolShare) =>
      poolShare.poolId.tokens.map((poolToken) => {
        const [, tokenAddress] = poolToken.id.split('-');
        if (tokenAddress === options.address.toLowerCase()) {
          const userAddress = getAddress(poolShare.userAddress.id);
          if (!score[userAddress]) score[userAddress] = 0;
          score[userAddress] =
            score[userAddress] +
            (poolToken.balance / poolShare.poolId.totalShares) *
              poolShare.balance;
        }
      })
    );
  }
  return score || {};
}
