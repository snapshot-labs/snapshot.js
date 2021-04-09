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
        options.stakingRewardUniswap2,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.stakingRewardUniswap2,
        'earned',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.stakingRewardUniswap3,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.stakingRewardUniswap3,
        'earned',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.sushiswap,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.stakingRewardSushiSwap2,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.stakingRewardSushiSwap2,
        'earned',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.stakingRewardSushiSwap3,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.stakingRewardSushiSwap3,
        'earned',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.token,
        'balanceOf',
        [address]
      ]),
      [options.token, 'balanceOf', [options.xLON]],
      [options.xLON, 'totalSupply', []],
      ...addresses.map((address: any) => [options.xLON, 'balanceOf', [address]])
    ],
    { blockTag }
  );

  // LON in uniswap ETH-LON pair / LP total supply
  const lonPerLPUniswap = parseUnits(response[0][0].toString(), 18).div(
    response[1][0]
  );
  // LON in sushiswap LON-USDT pair / SLP total supply
  const lonPerLPSushiSwap = parseUnits(response[2][0].toString(), 18).div(
    response[3][0]
  );
  // user's LP tokens
  const lpBalancesUniswap = response.slice(4, addresses.length + 4);
  // user's LP tokens in phase 2 uniswap staking contract
  const lpBalancesUniswapStaking2 = response.slice(
    addresses.length * 1 + 4,
    addresses.length * 2 + 4
  );
  // user's LON of rewards in phase 2 uniswap staking contract
  const lonEarnedBalancesUniswapStaking2 = response.slice(
    addresses.length * 2 + 4,
    addresses.length * 3 + 4
  );
  // user's LP tokens in phase 3 uniswap staking contract
  const lpBalancesUniswapStaking3 = response.slice(
    addresses.length * 3 + 4,
    addresses.length * 4 + 4
  );
  // user's LON of rewards in phase 3 uniswap staking contract
  const lonEarnedBalancesUniswapStaking3 = response.slice(
    addresses.length * 4 + 4,
    addresses.length * 5 + 4
  );
  // user's SLP tokens
  const lpBalancesSushiSwap = response.slice(
    addresses.length * 5 + 4,
    addresses.length * 6 + 4
  );
  // user's SLP tokens in phase 2 sushiswap staking contract
  const lpBalancesSushiSwapStaking2 = response.slice(
    addresses.length * 6 + 4,
    addresses.length * 7 + 4
  );
  // user's LON of rewards in phase 2 sushiswap staking contract
  const lonEarnedBalancesSushiSwapStaking2 = response.slice(
    addresses.length * 7 + 4,
    addresses.length * 8 + 4
  );
  // user's SLP tokens in phase 3 sushiswap staking contract
  const lpBalancesSushiSwapStaking3 = response.slice(
    addresses.length * 8 + 4,
    addresses.length * 9 + 4
  );
  // user's LON of rewards in phase 3 sushiswap staking contract
  const lonEarnedBalancesSushiSwapStaking3 = response.slice(
    addresses.length * 9 + 4,
    addresses.length * 10 + 4
  );
  // user's LON
  const tokenBalances = response.slice(
    addresses.length * 10 + 4,
    addresses.length * 11 + 4
  );
  // LON staked in xLON contract
  const lonBalanceOfxLON = response.slice(
    addresses.length * 11 + 4,
    addresses.length * 11 + 5
  )[0][0];
  // xLON total supply
  const xLONTotalSupply = response.slice(
    addresses.length * 11 + 5,
    addresses.length * 11 + 6
  )[0][0];
  // user's xLON
  const xLONBalanceOfUsers = response.slice(
    addresses.length * 11 + 6,
    addresses.length * 12 + 6
  );
  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const xLONBalanceOfUser = xLONBalanceOfUsers[i][0];
        const userLONShares = xLONBalanceOfUser
          .mul(lonBalanceOfxLON)
          .div(xLONTotalSupply);
        const lpBalanceUniswap = lpBalancesUniswap[i][0];
        const lpBalanceUniswapStaking2 = lpBalancesUniswapStaking2[i][0];
        const lpBalanceUniswapStaking3 = lpBalancesUniswapStaking3[i][0];
        const lonLpBalanceUniswap = lpBalanceUniswap
          .add(lpBalanceUniswapStaking2)
          .add(lpBalanceUniswapStaking3)
          .mul(lonPerLPUniswap)
          .div(parseUnits('1', 18));
        const lonEarnedBalanceUniswapStaking2 =
          lonEarnedBalancesUniswapStaking2[i][0];
        const lonEarnedBalanceUniswapStaking3 =
          lonEarnedBalancesUniswapStaking3[i][0];
        const lpBalanceSushiSwap = lpBalancesSushiSwap[i][0];
        const lpBalanceSushiSwapStaking2 = lpBalancesSushiSwapStaking2[i][0];
        const lpBalanceSushiSwapStaking3 = lpBalancesSushiSwapStaking3[i][0];
        const lonLpBalanceSushiSwap = lpBalanceSushiSwap
          .add(lpBalanceSushiSwapStaking2)
          .add(lpBalanceSushiSwapStaking3)
          .mul(lonPerLPSushiSwap)
          .div(parseUnits('1', 18));
        const lonEarnedBalanceSushiSwapStaking2 =
          lonEarnedBalancesSushiSwapStaking2[i][0];
        const lonEarnedBalanceSushiSwapStaking3 =
          lonEarnedBalancesSushiSwapStaking3[i][0];

        return [
          addresses[i],
          parseFloat(
            formatUnits(
              tokenBalances[i][0]
                .add(userLONShares)
                .add(lonLpBalanceUniswap)
                .add(lonEarnedBalanceUniswapStaking2)
                .add(lonEarnedBalanceUniswapStaking3)
                .add(lonLpBalanceSushiSwap)
                .add(lonEarnedBalanceSushiSwapStaking2)
                .add(lonEarnedBalanceSushiSwapStaking3),
              options.decimals
            )
          )
        ];
      })
  );
}
