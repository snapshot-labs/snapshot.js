import { formatUnits } from '@ethersproject/units';
import Multicaller from '../../utils/multicaller';

export const author = 'mystbrent';
export const version = '0.1.0';

const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCurrentHaloHaloPrice',
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

  addresses.forEach((address) => {
    multi.call(`scores.${address}.dsrtBalance`, options.token, 'balanceOf', [
      address
    ]);
  });

  multi.call('dsrtPrice', options.token, 'getCurrentHaloHaloPrice');

  const result = await multi.execute();
  const dsrtPrice = result.dsrtPrice;

  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const dsrtBalances = result.scores[addresses[i]].dsrtBalance;
        return [
          addresses[i],
          parseFloat(formatUnits(dsrtBalances.mul(dsrtPrice), 36))
        ];
      })
  );
}
