import { formatUnits } from '@ethersproject/units';
import Multicaller from '../../utils/multicaller';

export const author = 'chainlito';
export const version = '0.1.0';

const FARM_ADDRESS = '0xa206d322829e04fb5acd36f289ed5367ac3e73e4';
const LP_TOKEN_ADDRESS = '0xdf60e6416fcf8c955fddf01148753a911f7a5905';
const KUMA_TOKEN_ADDRESS = '0x48c276e8d03813224bb1e55f953adb6d02fd3e02';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
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
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
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
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const multi = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((address: any) => {
    multi.call(`kuma.${address}`, KUMA_TOKEN_ADDRESS, 'balanceOf', [address]);
    multi.call(`kumaInFarm.${address}`, FARM_ADDRESS, 'userInfo', ['12', address]);
    multi.call(`lpInFarm.${address}`, FARM_ADDRESS, 'userInfo', ['13', address]);
    multi.call(`lp.${address}`, LP_TOKEN_ADDRESS, 'balanceOf', [address]);
  });
  multi.call(`lp.totalSupply`, LP_TOKEN_ADDRESS, 'totalSupply', []);
  multi.call(`lp.kuma`, KUMA_TOKEN_ADDRESS, 'balanceOf', [LP_TOKEN_ADDRESS]);

  const result = await multi.execute();

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      parseFloat(
        formatUnits(result.kuma[address], options.decimals)
      ) +
      parseFloat(
        formatUnits(
          result.lpInFarm[address]
            .mul(result.lp.kuma)
            .div(result.lp.totalSupply),
          options.decimals
        )
      ) +
      parseFloat(
        formatUnits(
          result.lp[address]
            .mul(result.lp.kuma)
            .div(result.lp.totalSupply),
          options.decimals
        )
      ) +
      parseFloat(
        formatUnits(result.kumaInFarm[address], options.decimals)
      ) 
    ])
  );
}
