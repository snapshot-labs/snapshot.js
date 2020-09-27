import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import abi from './Uni.json';

const UNI_ADDRESS = {
  1: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
}

export async function strategy(network, provider, addresses, options, snapshot) {
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
