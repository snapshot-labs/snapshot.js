import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { uni_abi } from './UniV2.json';
import { token_abi } from './TestToken.json';

//options.address is the Uni-V2 token address
//options.tokenAddress is the token we are extracting
export async function strategy(network, provider, addresses, options, snapshot) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const totalSupply = (await multicall(
      network,
      provider,
      uni_abi,
      [options.address, 'totalSupply', []],
      { blockTag }
  )).map((value, _) => value)[0];
  const tokenBalanceInUni = (await multicall(
      network,
      provider,
      token_abi,
      [options.tokenAddress, 'balanceOf', [options.address]],
      { blockTag }
  )).map((value, _) => value)[0];

  const tokensPerUni = (tokenBalanceInUni / 10 ** options.decimals) / (totalSupply / 1e18);

  const response = await multicall(
    network,
    provider,
    uni_abi,
    addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
    { blockTag }
  );

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits((value * tokensPerUni).toString(), options.decimals))
    ])
  );
}
