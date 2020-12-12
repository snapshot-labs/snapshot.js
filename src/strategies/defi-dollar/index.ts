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

  const stakedBPTQuery = addresses.map((address: any) => [
    options.stakedBPT,
    'balanceOf',
    [address]
  ]);

  const response = await multicall(
    network,
    provider,
    abi,
    [
      [options.poolDFDDUSD, 'totalSupply'],
      [options.DFD, 'balanceOf', [options.poolDFDDUSD]],
      ...stakedBPTQuery,
    ],
    { blockTag }
  );

  const totalSupplyDFDDUSD = response[0]
  const poolBalanceDFDDUSD = response[1]
  const responseClean = response.slice(2, response.length);
  const chunks = chunk(responseClean, addresses.length);


  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {

        // console.log( poolBalanceDFDDUSD[0]
        //   .div(totalSupplyDFDDUSD[0])
        //   .mul(chunks[0][i][0]))

        return [
          addresses[i],
          parseFloat(
            formatUnits(
              poolBalanceDFDDUSD[0]
                .div(totalSupplyDFDDUSD[0])
                .mul(chunks[0][i][0])
                .toString(),
              options.decimals
            )
          )
        ]
      })
  );
}
