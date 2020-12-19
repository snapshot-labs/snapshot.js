import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'alexintosh';
export const version = '0.0.1';

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
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const doughv1Query = addresses.map((address: any) => [
    options.doughv1,
    'balanceOf',
    [address]
  ]);

  const doughv2Query = addresses.map((address: any) => [
    options.doughv2,
    'balanceOf',
    [address]
  ]);

  const eDOUGHQuery = addresses.map((address: any) => [
    options.eDOUGH,
    'balanceOf',
    [address]
  ]);

  const stakedDoughQuery = addresses.map((address: any) => [
    options.stakedDough,
    'balanceOf',
    [address]
  ]);

  const lpDoughQuery = addresses.map((address: any) => [
    options.BPT,
    'balanceOf',
    [address]
  ]);

  const response = await multicall(
    network,
    provider,
    abi,
    [
      [options.doughv2, 'balanceOf', [options.BPT]],
      [options.BPT, 'totalSupply'],
      ...doughv1Query,
      ...doughv2Query,
      ...eDOUGHQuery,
      ...stakedDoughQuery,
      ...lpDoughQuery
    ],
    { blockTag }
  );

  const doughv2BPT = response[0];
  const doughv2BptTotalSupply = response[1];
  const responseClean = response.slice(2, response.length);

  const chunks = chunk(responseClean, addresses.length);
  const doughv1Balances = chunks[0];
  const doughv2Balances = chunks[1];
  const eDOUGHBalances = chunks[2];
  const stakedDoughBalances = chunks[3];
  const lpDoughBalances = chunks[4];

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => [
        addresses[i],
        parseFloat(
          formatUnits(
            doughv2BPT[0]
              .mul(stakedDoughBalances[i][0])
              .div(doughv2BptTotalSupply[0])
              .add(
                doughv2BPT[0]
                  .mul(lpDoughBalances[i][0])
                  .div(doughv2BptTotalSupply[0])
              )
              .add(doughv1Balances[i][0])
              .add(doughv2Balances[i][0])
              .add(eDOUGHBalances[i][0])
              .toString(),
            options.decimals
          )
        )
      ])
  );
}
