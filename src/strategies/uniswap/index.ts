import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { abi as uniAbi } from './UniV2.json';
import { abi as tokenAbi } from '../erc20-balance-of/TestToken.json';

//options.address is the Uni-V2 token address
//options.tokenAddress is the token we are extracting
export async function strategy(network, provider, addresses, options, snapshot) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const res = await Promise.all([
    multicall(
      network,
      provider,
      uniAbi,
      [[options.address, 'totalSupply', []]],
      { blockTag }
    ),
    multicall(
      network,
      provider,
      tokenAbi,
      [[options.tokenAddress, 'balanceOf', [options.address]]],
      { blockTag }
    ),
    multicall(
      network,
      provider,
      uniAbi,
      addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
      { blockTag }
    )
  ]);

  const totalSupply = res[0].map((value, _) => value)[0];
  const tokenBalanceInUni = res[1].map((value, _) => value)[0];
  const tokensPerUni = (tokenBalanceInUni / 10 ** options.decimals) / (totalSupply / 1e18);

  const response = res[2];

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits((value * tokensPerUni).toString(), options.decimals))
    ])
  );
}
