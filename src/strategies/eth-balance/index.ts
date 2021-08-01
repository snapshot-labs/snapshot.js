import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import networks from '../../networks.json';
import examplesFile from './examples.json';

export const author = 'bonustrack';
export const version = '0.1.0';
export const examples = examplesFile;

const abi = [
  'function getEthBalance(address addr) public view returns (uint256 balance)'
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
      networks[network].multicall,
      'getEthBalance',
      [address]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), 18))
    ])
  );
}
