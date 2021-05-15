import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';

export const author = 'atvanguard';
export const version = '0.1.0';

const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
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
  },
  {
    constant: true,
    inputs: [],
    name: 'getPricePerFullShare',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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

  const queries: any[] = [];

  addresses.forEach((voter) => {
    queries.push([options.address, 'balanceOf', [voter]]);
  });
  queries.push([options.address, 'getPricePerFullShare']);

  const response = (await multicall(network, provider, abi, queries, { blockTag })).map((r) => BigNumber.from(r[0]));
  const pps = response[response.length - 1]

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        return [
          addresses[i],
          parseFloat(formatUnits(response[i].mul(pps).div(BigNumber.from(10).pow(18)).toString(), 18 /* decimals */))
        ];
      })
  );
}
