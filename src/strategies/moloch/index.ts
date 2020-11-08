import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'adridadou';
export const version = '0.1.0';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'memberAddressByDelegateKey',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'members',
    outputs: [
      {
        internalType: 'address',
        name: 'delegateKey',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'shares',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'loot',
        type: 'uint256'
      },
      {
        internalType: 'bool',
        name: 'exists',
        type: 'bool'
      },
      {
        internalType: 'uint256',
        name: 'highestIndexYesVote',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'jailed',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalShares',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
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
  const memberAddresses = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.address,
      'memberAddressByDelegateKey',
      [address]
    ]),
    { blockTag }
  );

  const response = await multicall(
    network,
    provider,
    abi,
    memberAddresses
      .filter(
        (addr) =>
          addr.toString() !== '0x0000000000000000000000000000000000000000'
      )
      .map((addr: any) => [options.address, 'members', [addr.toString()]]),
    { blockTag }
  );

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.shares.toString(), options.decimals))
    ])
  );
}
