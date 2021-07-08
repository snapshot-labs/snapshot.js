import { formatUnits } from '@ethersproject/units';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import Multicaller from '../../utils/multicaller';

export const author = 'impossible-finance';
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
    inputs: [],
    name: 'totalSupply',
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

  const multi = new Multicaller(network, provider, abi, { blockTag });

  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  // Calculates number of LP tokens each guy owns
  addresses.forEach((address: any) => {
    options.pairs.forEach((pair: any, idx: number) => {
      multi.call(
        `lpBalance.${idx}.${address}`,
        options.pairs[idx].address,
        'balanceOf',
        [address]
      );
    });
  });

  // Calculates total IF locked in each pair
  // Also calculates total supply of LP tokens
  options.pairs.forEach((pair: any, idx: number) => {
    multi.call(
      `pairIFBalance.${idx}`,
      options.address, // IF token address
      'balanceOf',
      [pair.address]
    );
    multi.call(`pairTotalSupply.${idx}`, pair.address, 'totalSupply', []);
  });

  const result = await multi.execute();

  return Object.fromEntries(
    Object.entries(score).map((address) => [
      address[0],
      address[1] +
        options.pairs.reduce(
          (prev: number, cur: any, idx: number) =>
            prev +
            parseFloat(
              formatUnits(
                result.lpBalance[idx][address[0]]
                  .mul(result.pairIFBalance[idx])
                  .mul(options.pairs[idx].weightNumerator)
                  .div(result.pairTotalSupply[idx])
                  .div(options.pairs[idx].weightDenominator),
                options.pairs[idx].decimals
              )
            ),
          0
        )
    ])
  );
}
