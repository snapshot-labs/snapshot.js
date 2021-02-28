import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'w1kke';
export const version = '0.1.0';

const OCEAN_SUBGRAPH_URL = {
  '1': 'https://subgraph.mainnet.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph',
  '42': 'https://subgraph.rinkeby.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph'
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
    pools: {
      __args: {
        first: 1000,
        orderBy: 'oceanReserve',
        orderDirection: 'desc'
      },
      active: true,
      totalShares: true,
      holderCount: true,
      oceanReserve: true,
      shares: {
        __args: {
          first: 1000,
          orderBy: 'balance',
          orderDirection: 'desc'
        },
        userAddress: {
          id: true,
          tokensOwned: true
        },
        balance: true
      },
      tokens: {
        balance: true,
        denormWeight: true,
        tokenId: {
          id: true
        }
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.pools.__args.block = { number: +snapshot };
  }

  const result = await subgraphRequest(OCEAN_SUBGRAPH_URL[network], params);

  const score = {};
  if (result && result.pools) {
    result.pools.forEach((pool) => {
      if (pool.holderCount > 0 && pool.active) {
        pool.shares.map((share) => {
          const userAddress = getAddress(share.userAddress.id);
          if (!score[userAddress]) score[userAddress] = 0;
          score[userAddress] =
            score[userAddress] +
            (pool.oceanReserve / pool.totalShares) *
              share.balance;
        });
      }
    });
  }
  return score || {};
}
