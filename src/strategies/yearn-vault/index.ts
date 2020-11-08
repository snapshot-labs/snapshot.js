import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'bonustrack';
export const version = '0.1.0';

const abi = [
  {
    constant: true,
    inputs: [],
    name: 'getPricePerFullShare',
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
  let [score, [pricePerFullShare]] = await Promise.all([
    erc20BalanceOfStrategy(
      space,
      network,
      provider,
      addresses,
      options,
      snapshot
    ),
    multicall(
      network,
      provider,
      abi,
      [[options.address, 'getPricePerFullShare', []]],
      { blockTag }
    )
  ]);
  pricePerFullShare = parseFloat(formatUnits(pricePerFullShare.toString(), 18));
  return Object.fromEntries(
    Object.entries(score).map((address: any) => [
      address[0],
      address[1] * pricePerFullShare
    ])
  );
}
