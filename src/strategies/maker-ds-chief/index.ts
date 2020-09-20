import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { abi } from './DSChief.json';

const MAKER_DS_CHIEF_ADDRESS = {
  1: '0x9ef05f7f6deb616fd37ac3c959a2ddd25a54e4f5'
}

export async function strategy(network, provider, addresses, options, snapshot) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      MAKER_DS_CHIEF_ADDRESS[network],
      'deposits',
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
