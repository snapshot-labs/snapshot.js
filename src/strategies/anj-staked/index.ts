import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'Evalir';
export const version = '0.1.0';

const abi = [
  {
    constant: true,
    inputs: [{ name: '_juror', type: 'address' }],
    name: 'totalStakedFor',
    outputs: [{ name: '', type: 'uint256' }],
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
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.jurorsRegistry,
      'totalStakedFor',
      [address]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals))
    ])
  );
}
