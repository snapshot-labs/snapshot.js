import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { subgraphRequest, multicall } from '../../utils';

export const author = 'bun919tw';
export const version = '0.1.0';

const CREAM_SWAP_SUBGRAPH_URL = {
  1: 'https://api.thegraph.com/subgraphs/name/creamfinancedev/cream-swap-v2',
  3: 'https://api.thegraph.com/subgraphs/name/creamfinancedev/cream-swap-dev'
};

const longTermPoolABI = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const creamAddress = options.address;
  let [score, creamBalance] = await Promise.all([
    creamSwapScore(network, addresses, creamAddress, snapshot),
    creamBalanceOf(network, provider, addresses, options, snapshot)
  ]);
  for (const [userAddress, userBalance] of Object.entries(creamBalance)) {
    if (!score[userAddress]) score[userAddress] = 0;
    score[userAddress] = score[userAddress] + userBalance;
  }

  return score || {};
}

async function creamSwapScore(network, addresses, creamAddress, snapshot) {
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
  const result = await subgraphRequest(
    CREAM_SWAP_SUBGRAPH_URL[network],
    params
  );
  const score = {};
  if (result && result.poolShares) {
    result.poolShares.forEach((poolShare) =>
      poolShare.poolId.tokens.map((poolToken) => {
        const [, tokenAddress] = poolToken.id.split('-');
        if (tokenAddress === creamAddress.toLowerCase()) {
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

async function creamBalanceOf(network, provider, addresses, options, snapshot) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const numPool = options.pools.length;
  const numAddress = addresses.length;

  const calls: any = [];
  for (let i = 0; i < numPool; i++) {
    calls.push(
      ...addresses.map((address) => [
        options.pools[i].address,
        'balanceOf',
        [address]
      ])
    );
  }

  const balances = await multicall(network, provider, longTermPoolABI, calls, {
    blockTag
  });

  return Object.fromEntries(
    addresses.map((address, i) => {
      let sum = 0;
      for (let j = 0; j < numPool; j++) {
        sum += parseFloat(
          formatUnits(balances[i + j * numAddress].toString(), 18)
        );
      }
      return [address, sum];
    })
  );
}
