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
    multi.call(`stax.${address}`, options.stax.address, 'balanceOf', [address]);
    multi.call(
      `stakingChef.${address}`,
      options.stakingchef.address,
      'poolsInfo',
      [address]
    );
    options.pools.forEach((pool: any) => {
      multi.call(
        `masterChef.${address}.pool_${pool.poolId}`,
        options.masterchef.address,
        'userInfo',
        [pool.poolId, address]
      );
    });
  });

  const result = await multi.execute();

  const parseRes = (elem, decimals) => {
    return parseFloat(formatUnits(elem, decimals));
  };

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      parseRes(result.stax[address], options.stax.decimals) +
        parseRes(result.stakingChef[address], options.stakingchef.decimals) *
          options.stakingchef.weightage +
        +options.pools.reduce(
          (prev: number, pool: any) =>
            prev +
            parseRes(
              result.masterChef[address][`pool_${pool.poolId}`][0],
              options.masterchef.decimals
            ) *
              pool.weightage,
          0
        )
    ])
  );
}
