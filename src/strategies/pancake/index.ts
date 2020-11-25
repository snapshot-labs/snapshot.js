import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'pancake-swap';
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
    name: 'userInfo',
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
  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const balances = await Promise.all(
    options.chefAddresses.map((chefAddress) =>
      multicall(
        network,
        provider,
        abi,
        addresses.map((address: any) => [
          chefAddress,
          'userInfo',
          [address],
          { blockTag }
        ]),
        { blockTag }
      )
    )
  );

  return Object.fromEntries(
    Object.entries(score).map((address, index) => [
      address[0],
      address[1] +
        balances.reduce(
          (prev: number, cur: any) =>
            prev +
            parseFloat(
              formatUnits(cur[index].amount.toString(), options.decimals)
            ),
          0
        )
    ])
  );
}
