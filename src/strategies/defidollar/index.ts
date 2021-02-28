import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'atvanguard';
export const version = '0.1.0';

const abi = [
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
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'earned',
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
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'claimable_reward',
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
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const queries: any[] = [];

  // curve farm needs special handling
  addresses.forEach((voter) => {
    queries.push([options.farms.curve.farm, 'claimable_reward', [voter]]);
  });

  const farms = Object.keys(options.farms).slice(1); // exclude curve
  for (let i = 0; i < farms.length; i++) {
    const { farm, lpToken } = options.farms[farms[i]];
    queries.push([options.DFD, 'balanceOf', [lpToken]]);
    queries.push([lpToken, 'totalSupply']);
    addresses.forEach((voter) => {
      queries.push([farm, 'balanceOf', [voter]]);
      queries.push([lpToken, 'balanceOf', [voter]]);
      queries.push([farm, 'earned', [voter]]);
    });
  }

  let response = await multicall(network, provider, abi, queries, { blockTag });

  const n = addresses.length;
  const curveEarned = response.slice(0, n).map((r) => r[0]);
  response = response.slice(n);

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        let score = curveEarned[i];

        while (response.length) {
          const res = response.slice(0, 2 + 3 * n).map((r) => r[0]); // 2 + 3n queries for each farm
          response = response.slice(2 + 3 * n);
          /*
            lpTokenBalance = farm.balanceOf(user) + lpToken.balanceOf(user)
            staked = (dfd.balanceOf(lpToken) * lpTokenBalance) / lpToken.totalSupply()
            earned = farm.earned(user)
            score = staked + earned
          */
          const start = 2 + 3 * i;
          const lpTokenBalance = res[start].add(res[start + 1]);
          const staked = res[0].mul(lpTokenBalance).div(res[1]);
          const earned = res[start + 2];
          score = score.add(staked).add(earned);
        }

        return [
          addresses[i],
          parseFloat(formatUnits(score.toString(), 18 /* decimals */))
        ];
      })
  );
}
