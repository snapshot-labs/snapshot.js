import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.0';

const UNI_ADDRESS = {
  '1': '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
};

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
    name: 'getCurrentVotes',
    outputs: [
      {
        internalType: 'uint96',
        name: '',
        type: 'uint96'
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
    addresses.map((address: any) => [
      UNI_ADDRESS[network],
      'getCurrentVotes',
      [address.toLowerCase()],
      { blockTag }
    ])
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals))
    ])
  );
}
