import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
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
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'claimed_rewards_for',
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
  },
  {
    constant: true,
    inputs: [],
    name: 'getPricePerFullShare',
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

  addresses.forEach((voter) => {
    queries.push([options.farms.curve.farm, 'claimable_reward', [voter]]);
  });

  addresses.forEach((voter) => {
    queries.push([options.farms.curve.farm, 'claimed_rewards_for', [voter]]);
  });

  addresses.forEach((voter) => {
    queries.push([options.farms.sushiEthDusd.farm, 'earned', [voter]]);
  });

  addresses.forEach((voter) => {
    queries.push([options.farms.ibDFD.address, 'balanceOf', [voter]]);
  });
  queries.push([options.farms.ibDFD.address, 'getPricePerFullShare']);

  const farms = Object.keys(options.farms).slice(3);
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
  response = response.map((r) => r[0]);
  const n = addresses.length;

  const dfdEarned = response.slice(0, n);
  const dfdClaimed = response.slice(n, 2 * n);
  const sushiEthDusdEarned = response.slice(2 * n, 3 * n);
  const ppfs = response[4 * n];
  const ibDFD = response
    .slice(3 * n, 4 * n)
    .map((r) => r.mul(ppfs).div(BigNumber.from(10).pow(18)));
  response = response.slice(4 * n + 1);

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        let score = dfdEarned[i]
          .sub(dfdClaimed[i])
          .add(sushiEthDusdEarned[i])
          .add(ibDFD[i]);
        while (response.length) {
          const res = response.slice(0, 2 + 3 * n); // 2 + 3n queries for each farm
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
