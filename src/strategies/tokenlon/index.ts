import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'TokenlonDev';
export const version = '0.1.0';

const TFT_ADDRESS = '0xE534619dEFDBF0cAf673b8AbF7158714F5BD4bd9';

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
    addresses.map((address: any) => [TFT_ADDRESS, 'balanceOf', [address]]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      (parseFloat(formatUnits(value.toString(), 0)) > 0 ? 1 : 0)
    ])
  );
}
