import { multicall } from '../../utils';
import { abi as uniAbi } from './UniV2.json';

export const author = 'vfatouros';
export const version = '0.1.0';

const tokenAbi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const res = await Promise.all([
    multicall(
      network,
      provider,
      uniAbi,
      [[options.uniswapAddress, 'totalSupply', []]],
      { blockTag }
    ),
    multicall(
      network,
      provider,
      tokenAbi,
      [[options.tokenAddress, 'balanceOf', [options.uniswapAddress]]],
      { blockTag }
    ),
    multicall(
      network,
      provider,
      uniAbi,
      addresses.map((address: any) => [options.stakingAddress, 'balanceOf', [address]]),
      { blockTag }
    )
  ]);

  const totalSupply = res[0][0];
  const tokenBalanceInUni = res[1][0];
  const tokensPerUni = (tokenBalanceInUni / 10 ** options.decimals) / (totalSupply / 1e18);

  const response = res[2];

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      value / 10 ** options.decimals * tokensPerUni
    ])
  );
}
