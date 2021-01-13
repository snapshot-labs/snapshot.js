import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'stablexswap';
export const version = '0.0.1';

const bep20abi = [
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

const staxERC20ContractAddress = '0x0da6ed8b13214ff28e9ca979dd37439e8a88f6c4';
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

  // For erc20 token balances not staked in any contract
  const score = await multicall(
    network,
    provider,
    bep20abi,
    addresses.map((address: any) => [
      staxERC20ContractAddress,
      'balanceOf',
      [address]
    ]),
    { blockTag }
  );

  // For tokens in stakingChef contract @0x0c0
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

  // For tokens in Superchef contract @0xc80
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

  const parseRes = (elem, decimals) => {
    return parseFloat(
      formatUnits(elem.amount.toString(), decimals)
    )
  }

  return Object.fromEntries(
    addresses.map((address, index) => [
      address,
      parseRes(score[index], 18)
        +
      options.stakingWeightage * parseRes(stakingBalances[index], options.stakingDecimals)
        +
      options.masterWeightage * parseRes(masterBalances[index], options.masterDecimals)
    ])
  );
}
