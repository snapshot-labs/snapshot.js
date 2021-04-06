import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { verifyResultsLength, verifyResults } from './oceanUtils';

export const author = 'w1kke';
export const version = '0.1.0';

const OCEAN_ERC20_DECIMALS = 18;
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
          where: {
            userAddress_in: addresses.map((address) => address.toLowerCase())
          },
          orderBy: 'balance',
          orderDirection: 'desc'
        },
        userAddress: {
          id: true
        },
        balance: true
      }
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.pools.__args.block = { number: +snapshot };
  }

  // Retrieve the top 1000 pools
  const graphResults = await subgraphRequest(
    OCEAN_SUBGRAPH_URL[network],
    params
  );

  // Get total votes, for ALL addresses, inside top 1000 pools, with a minimum of 0.0001 shares
  const score = {};
  const userAddresses: string[] = [];
  const return_score = {};
  if (graphResults && graphResults.pools) {
    graphResults.pools.forEach((pool) => {
      if (pool.holderCount > 0 && pool.active) {
        pool.shares.map((share) => {
          const userAddress = getAddress(share.userAddress.id);
          if (!userAddresses.includes(userAddress))
            userAddresses.push(userAddress);
          if (!score[userAddress]) score[userAddress] = BigNumber.from(0);
          let userShare =
            share.balance * (pool.oceanReserve / pool.totalShares);
          if (userShare > 0.0001) {
            score[userAddress] = score[userAddress].add(
              bdToBn(userShare.toString(), OCEAN_ERC20_DECIMALS)
            );
          }
        });
      }
    });

    // We then sum total votes, per user address
    userAddresses.forEach((address) => {
      let parsedSum = parseFloat(
        formatUnits(score[address], OCEAN_ERC20_DECIMALS)
      );
      return_score[address] = parsedSum;
    });
  }

  // We then filter only the addresses expected
  const results = Object.fromEntries(
    Object.entries(return_score).filter(([k, v]) => addresses.indexOf(k) >= 0)
  );

  // Test validation: Update examples.json w/ expectedResults to reflect LPs @ blockHeight
  // Success criteria: Address scores and length, must match expectedResults. Order not validated.
  // From GRT's graphUtils.ts => verifyResults => Scores need to match expectedResults.
  // npm run test --strategy=ocean-marketplace | grep -E 'SUCCESS|ERROR'
  if (options.expectedResults) {
    let expectedResults = {};
    Object.keys(options.expectedResults.scores).forEach(function (key) {
      expectedResults[key] = results[key];
    });

    verifyResults(
      JSON.stringify(expectedResults),
      JSON.stringify(options.expectedResults.scores),
      'Scores'
    );

    verifyResultsLength(
      Object.keys(expectedResults).length,
      Object.keys(options.expectedResults.scores).length,
      'Scores'
    );
  }

  return results || {};
}
