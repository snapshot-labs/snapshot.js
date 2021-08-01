import { multicall } from '../../utils';
import examplesFile from './examples.json';
import aboutFile from './README.md';

export const author = 'davekaj';
export const version = '0.1.0';
export const examples = examplesFile;
export const about = aboutFile;

const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      }
    ],
    name: 'isOwner',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
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
    addresses.map((address: any) => [options.address, 'isOwner', [address]]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [addresses[i], value[0] ? 1 : 0])
  );
}
