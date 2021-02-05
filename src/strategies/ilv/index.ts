import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'andytcf';
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
    addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
    { blockTag }
  );
  const quadraticWeighting = (value) => {
    const scaledValue = value;
    return Math.sqrt(scaledValue);
  };
  return Object.fromEntries(
    response.map((value, i) => {
      return [
        addresses[i],
        quadraticWeighting(
          parseFloat(formatUnits(value.toString(), options.decimals))
        )
      ];
    })
  );
}
