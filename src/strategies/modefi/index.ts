import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'OxAL7';
export const version = '0.0.1';
const MOD_POOL_ADDRESS = '0x3093896c81c8d8b9bf658fbf1aede09207850ca2';

const abi = [
  {
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
    stateMutability: 'view',
    type: 'function'
  }
];

const stakingPoolAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'userInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'rewardDebt',
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
  const balanceResponse = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
    { blockTag }
  );

  const stakeResponse = await multicall(
    network,
    provider,
    stakingPoolAbi,
    addresses.map((address: any) => [MOD_POOL_ADDRESS, 'userInfo', [address]]),
    { blockTag }
  );
  return Object.fromEntries(
    balanceResponse.map((value, i) => {
      const balance1 = value[0];
      const balance2 = stakeResponse[i].amount;
      const sum = balance1.add(balance2);

      return [
        addresses[i],
        parseFloat(formatUnits(sum.toString(), options.decimals))
      ];
    })
  );
}
