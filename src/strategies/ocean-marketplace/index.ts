import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'w1kke';
export const version = '0.1.0';

const OCEAN_SUBGRAPH_URL = {
  '1':
    'https://subgraph.mainnet.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph',
  '42':
    'https://subgraph.rinkeby.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph'
};

// Returns a BigDecimal as a BigNumber with 10^decimals extra zeros
export function bdToBn(bd, decimals) {
  let bn;
  const splitDecimal = bd.split('.');

  if (splitDecimal.length > 1) {
    bn = `${splitDecimal[0]}.${splitDecimal[1].slice(
      0,
      decimals - splitDecimal[0].length - 1
    )}`;
  } else {
    bn = `${splitDecimal[0]}`;
  }

  const bn2 = parseUnits(bn, decimals);
  return bn2;
}

function bn(num: any): BigNumber {
  return BigNumber.from(num.toString());
}

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
  const userAddresses: string[] = [];
  const return_score = {};
  if (result && result.pools) {
    result.pools.forEach((pool) => {
      if (pool.holderCount > 0 && pool.active) {
        pool.shares.map((share) => {
          const userAddress = getAddress(share.userAddress.id).toLowerCase();
          if (!userAddresses.includes(userAddress))
            userAddresses.push(userAddress);
          if (!score[userAddress]) score[userAddress] = BigNumber.from(0);
          let userShare =
            share.balance * (pool.oceanReserve / pool.totalShares);
          if (userShare > 0.0001) {
            score[userAddress] = score[userAddress].add(
              bdToBn(userShare.toString(), options.decimals)
            );
          }
        });
      }
    });

    userAddresses.forEach((address) => {
      let parsedSum = parseFloat(formatUnits(score[address], options.decimals));
      return_score[address] = parsedSum;
    });
  }

  return return_score || {};
}
