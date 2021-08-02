import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import examplesFile from './examples.json';
import aboutFile from './README.md';

export const author = 'bonustrack';
export const version = '0.1.0';
export const examples = examplesFile;
export const about = aboutFile;

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
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
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), 0))
    ])
  );
}
