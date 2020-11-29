import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'l3wi';
export const version = '0.1.0';

const abi = [
  {
    constant: true,
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOfBonded',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
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

  const daoQuery = addresses.map((address: any) => [
    options.dao,
    'balanceOfBonded',
    [address]
  ]);

  const lpQuery = addresses.map((address: any) => [
    options.rewards,
    'balanceOfBonded',
    [address]
  ]);

  const response = await multicall(
    network,
    provider,
    abi,
    [
      [options.token, 'balanceOf', [options.uniswap]],
      [options.uniswap, 'totalSupply'],
      ...daoQuery,
      ...lpQuery
    ],
    { blockTag }
  );

  const uniswapESD = response[0];
  const uniswapTotalSupply = response[1];
  const daoBalances = response.slice(2, addresses.length + 2);
  const lpBalances = response.slice(
    addresses.length + 2,
    addresses.length * 2 + 2
  );

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => [
        addresses[i],
        parseFloat(
          formatUnits(
            uniswapESD[0]
              .div(uniswapTotalSupply[0])
              .mul(lpBalances[i][0])
              .add(daoBalances[i][0])
              .toString(),
            options.decimals
          )
        )
      ])
  );
}
