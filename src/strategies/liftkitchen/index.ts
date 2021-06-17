import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'Gruffin';
export const version = '0.1.1';

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
    name: 'getbalanceOfControl',
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
      },
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

  const addressCount = addresses.length;

  addresses.forEach((address) => {
    queries.push([options.ctrl, 'balanceOf', [address]]);
  });

  addresses.forEach((address) => {
    queries.push([options.boardroom, 'getbalanceOfControl', [address]]);
  });

  addresses.forEach((address) => {
    queries.push([options.boardroom, 'earned', [address]]);
  });

  let response = await multicall(network, provider, abi, queries, { blockTag });

  const ctrlOwned = response.slice(0, addressCount);
  const ctrlStaked = response.slice(addressCount, addressCount * 2);
  const ctrlEarned = response.slice(addressCount * 2, addressCount * 3);

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        let score = ctrlOwned[i][0]
          .add(ctrlStaked[i][0])
          .add(ctrlEarned[i][0])
          .add(ctrlEarned[i][1]);

        return [
          addresses[i],
          parseFloat(formatUnits(score.toString(), options.decimals))
        ];
      })
  );
}
