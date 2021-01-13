import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'stablexswap';
export const version = '0.0.1';

const sousChefabi = [
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
  }
];

const masterChefAbi = [
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
  }
];

const stakingChefAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'poolsInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
]

const masterChefContractAddress = '0xc80991f9106e26e43bf1c07c764829a85f294c71';
const stakingChefContractAddress = '0x0c0c475e32212b748c328e451ab3862ffe07369e';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // For tokens in stakingchef contract, 0x0c0
  // poolsInfo
  const stakingBalances = await multicall(
    network,
    provider,
    stakingChefAbi,
    addresses.map((address: any) => [
      stakingChefContractAddress,
      'poolsInfo',
      [address]
    ]),
    { blockTag }
  );

  // For tokens in superchef contract, 0xc80
  const masterBalances = await multicall(
    network,
    provider,
    masterChefAbi,
    addresses.map((address: any) => [
      masterChefContractAddress,
      'userInfo',
      ['0', address]
    ]),
    { blockTag }
  );

  // for stax in LP pools STAX/BNB etc
  const sousBalances = await Promise.all(
    options.chefAddresses.map((item) =>
      multicall(
        network,
        provider,
        sousChefabi,
        addresses.map((address: any) => [
          item.address,
          'balanceOf', // Not UserInfo?
          [address],
          { blockTag }
        ]),
        { blockTag }
      )
    )
  );


  return Object.fromEntries(
    addresses.map((address, index) => [
      address,
      options.stakingWeightage *
      parseFloat(
        formatUnits(stakingBalances[index].amount.toString(), options.stakingDecimals)
      ) +
      options.masterWeightage *
      parseFloat(
        formatUnits(masterBalances[index].amount.toString(), options.masterDecimals)
      ) +
      sousBalances.reduce<number>(
        (prev: number, cur: any, idx: number) =>
        prev +
          options.chefAddresses[idx].weightage *
          parseFloat(
            formatUnits(
              cur[index].amount.toString(),
              options.chefAddresses[idx].decimals
            )
          ),
        0
      )
    ])
  );
}
