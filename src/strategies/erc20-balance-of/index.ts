import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { abi } from './TestToken.json';

export const author = 'bonustrack';
export const version = '0.1.0';

export async function strategy(network, provider, addresses, options, snapshot) {
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
      parseFloat(formatUnits(value.toString(), options.decimals))
    ])
  );
}
