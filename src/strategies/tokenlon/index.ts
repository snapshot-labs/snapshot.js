import { formatUnits, parseUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'BenjaminLu';
export const version = '0.1.0';

const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'earned',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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
    [
      [options.token, 'balanceOf', [options.uniswap]],
      [options.uniswap, 'totalSupply'],
      [options.token, 'balanceOf', [options.sushiswap]],
      [options.sushiswap, 'totalSupply'],
      ...addresses.map((address: any) => [
        options.uniswap,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.stakingRewardUniswap,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.stakingRewardUniswap,
        'earned',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.sushiswap,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.stakingRewardSushiSwap,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.stakingRewardSushiSwap,
        'earned',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.token,
        'balanceOf',
        [address]
      ])
    ],
    { blockTag }
  );

  const lonPerLPUniswap = parseUnits(response[0][0].toString(), 18).div(
    response[1][0]
  );
  const lonPerLPSushiSwap = parseUnits(response[2][0].toString(), 18).div(
    response[3][0]
  );
  const lpBalancesUniswap = response.slice(4, addresses.length + 4);
  const lpBalancesUniswapStaking = response.slice(
    addresses.length * 1 + 4,
    addresses.length * 2 + 4
  );
  const lonEarnedBalancesUniswapStaking = response.slice(
    addresses.length * 2 + 4,
    addresses.length * 3 + 4
  );
  const lpBalancesSushiSwap = response.slice(
    addresses.length * 3 + 4,
    addresses.length * 4 + 4
  );
  const lpBalancesSushiSwapStaking = response.slice(
    addresses.length * 4 + 4,
    addresses.length * 5 + 4
  );
  const lonEarnedBalancesSushiSwapStaking = response.slice(
    addresses.length * 5 + 4,
    addresses.length * 6 + 4
  );
  const tokenBalances = response.slice(
    addresses.length * 6 + 4,
    addresses.length * 7 + 4
  );

  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const lpBalanceUniswap = lpBalancesUniswap[i][0];
        const lpBalanceUniswapStaking = lpBalancesUniswapStaking[i][0];
        const lonLpBalanceUniswap = lpBalanceUniswap
          .add(lpBalanceUniswapStaking)
          .mul(lonPerLPUniswap)
          .div(parseUnits('1', 18));
        const lonEarnedBalanceUniswapStaking =
          lonEarnedBalancesUniswapStaking[i][0];
        const lpBalanceSushiSwap = lpBalancesSushiSwap[i][0];
        const lpBalanceSushiSwapStaking = lpBalancesSushiSwapStaking[i][0];
        const lonLpBalanceSushiSwap = lpBalanceSushiSwap
          .add(lpBalanceSushiSwapStaking)
          .mul(lonPerLPSushiSwap)
          .div(parseUnits('1', 18));
        const lonEarnedBalanceSushiSwapStaking =
          lonEarnedBalancesSushiSwapStaking[i][0];

        return [
          addresses[i],
          parseFloat(
            formatUnits(
              tokenBalances[i][0]
                .add(lonLpBalanceUniswap)
                .add(lonEarnedBalanceUniswapStaking)
                .add(lonLpBalanceSushiSwap)
                .add(lonEarnedBalanceSushiSwapStaking),
              options.decimals
            )
          )
        ];
      })
  );
}
