import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'andytcf';
export const version = '0.0.1';

const synthetixStateAbi = [
  {
    constant: true,
    inputs: [{ name: '', type: 'address' }],
    name: 'issuanceData',
    outputs: [
      { name: 'initialDebtOwnership', type: 'uint256' },
      { name: 'debtEntryIndex', type: 'uint256' }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

const synthetixStateContractAddress =
  '0x4b9Ca5607f1fF8019c1C6A3c2f0CC8de622D5B82';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  _,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    synthetixStateAbi,
    addresses.map((address: any) => [
      synthetixStateContractAddress,
      'issuanceData',
      [address]
    ]),
    { blockTag }
  );

  const quadraticWeighting = (value) => {
    // Scale the value by 100000
    const scaledValue = value * 1e5;
    console.log('scaledValue', scaledValue);
    return Math.sqrt(scaledValue);
  };
  return Object.fromEntries(
    response.map((value, i) => {
      return [
        addresses[i],
        // initialDebtOwnership returns in 27 decimal places
        quadraticWeighting(
          parseFloat(formatUnits(value.initialDebtOwnership.toString(), 27))
        )
      ];
    })
  );
}
