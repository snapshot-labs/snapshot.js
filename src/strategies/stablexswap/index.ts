import { formatUnits } from '@ethersproject/units';
import Multicaller from '../../utils/multicaller';

export const author = 'stablexswap';
export const version = '0.0.1';

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
    multi.call(`stax.${address}`, options.staxAddress, 'balanceOf', [address]);
    multi.call(`stakingChef.${address}`, options.stakingChefAddress, 'poolsInfo', [address]);
    options.pools.forEach((poolId: any) => {
      multi.call(
        `masterChef.${address}.pool_${poolId}`,
        options.masterChefAddress,
        'userInfo',
        [poolId, address]
      )
    })
  });

  const result = await multi.execute();

  const parseRes = (elem, decimals) => {
    return parseFloat(
      formatUnits(elem, decimals)
    )
  };

  return Object.fromEntries(
    addresses.map((address) => [
        address,
        parseRes(result.stax[address], 18) * 1
          +
        parseRes(result.stakingChef[address], options.stakingDecimals) * options.stakingWeightage +
          +
        options.pools.reduce((prev: number, poolId: any, idx: number) =>
          prev + parseRes(result.masterChef[address][`pool_${poolId}`], options.masterDecimals) * options.poolsWeightage[idx], 0
        )
      ])
  );
}
