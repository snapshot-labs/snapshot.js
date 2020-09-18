import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { abi } from './NoMintRewardPool.json';

const FARM_NO_MINT_REWARD_POOL_ADDRESS = '0x59258F4e15A5fC74A7284055A8094F58108dbD4f';

export async function strategy(provider, addresses, options, snapshot) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    provider,
    abi,
    addresses.map((address: any) => [
      FARM_NO_MINT_REWARD_POOL_ADDRESS,
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
