import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'drop-out-dev';
export const version = '0.1.0';

const abi = [
  {
    inputs: [
      { internalType: 'address', name: '_lpToken', type: 'address' },
      { internalType: 'address', name: '_account', type: 'address' }
    ],
    name: 'getUser',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          {
            internalType: 'uint256[]',
            name: 'rewardsWriteoffs',
            type: 'uint256[]'
          }
        ],
        internalType: 'struct IBonusRewards.User',
        name: '',
        type: 'tuple'
      },
      { internalType: 'uint256[]', name: '', type: 'uint256[]' }
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
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.stakingAddress,
      'getUser',
      [options.tokenAddress, address]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map(([userInfo], i) => [
      addresses[i],
      parseFloat(formatUnits(userInfo.amount, options.decimals))
    ])
  );
}
