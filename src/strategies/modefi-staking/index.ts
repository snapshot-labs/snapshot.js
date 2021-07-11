import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'Modefi';
export const version = '0.0.1';

const stakingPoolAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: '_stakers',
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
      },
      {
        internalType: 'uint256',
        name: 'distributed',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'staked',
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

  const stakeResponse = await multicall(
    network,
    provider,
    stakingPoolAbi,
    addresses.map((address: any) => [
      options.stakingContract,
      '_stakers',
      [address]
    ]),
    { blockTag }
  );

  return Object.fromEntries(
    stakeResponse.map((value, i) => {
      const stakedBalance = stakeResponse[i].amount;

      return [
        addresses[i],
        parseFloat(formatUnits(stakedBalance.toString(), options.decimals))
      ];
    })
  );
}
