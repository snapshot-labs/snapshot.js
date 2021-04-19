import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'nerve-finance';
export const version = '0.0.1';

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

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const masterBalances = await multicall(
    network,
    provider,
    masterChefAbi,
    addresses.map((address: any) => [
      options.masterChefContractAddress,
      'userInfo',
      ['2', address]
    ]),
    { blockTag }
  );

  return Object.fromEntries(
    Object.entries(score).map((address, index) => [
      address[0],
      address[1] +
        parseFloat(formatUnits(masterBalances[index].amount.toString(), 18))
      // +
      // sousBalances.reduce(
      //   (prev: number, cur: any, idx: number) =>
      //     prev +
      //     parseFloat(
      //       formatUnits(
      //         cur[index].amount.toString(),
      //         options.chefAddresses[idx].decimals
      //       )
      //     ),
      //   0
      // )
    ])
  );
}
