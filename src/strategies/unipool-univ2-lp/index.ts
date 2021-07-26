import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'dapplion';
export const version = '0.1.0';

const contractAbi = [
  'function balanceOf(address account) view returns (uint256)',
  'function earned(address account) view returns (uint256)',
  'function totalSupply() public view returns (uint256)'
];

function bn(num: any): BigNumber {
  return BigNumber.from(num.toString());
}

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  let res = await multicall(
    network,
    provider,
    contractAbi,
    [
      [options.lpTokenAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [options.lpTokenAddress]],
      ...addresses.map((address: any) => [
        options.unipoolAddress,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.unipoolAddress,
        'earned',
        [address]
      ])
    ],
    { blockTag }
  );

  const lpTokenTotalSupply = bn(res[0]); // decimal: 18
  const totalTokensInPool = bn(res[1]); // decimal: options.decimal
  res = res.slice(2);

  // How much tokens user has from staked LP tokens
  const usersTokensFromLp = res.slice(0, addresses.length).map((num) => {
    const stakedLpTokens = bn(num); // decimal: 18
    // StakedLP x token.balanceOf(LPToken) / LPToken.totalSupply()
    return stakedLpTokens.mul(totalTokensInPool).div(lpTokenTotalSupply); // decimal: options.decimal
  });

  // How much rewarded tokens user have in the unipool contract
  const usersEarnedTokensList = res.slice(addresses.length).map((num) => {
    return bn(num); // decimal: options.decimal
  });

  const sumList = usersTokensFromLp.map((userTokensFromLp, i) => {
    return userTokensFromLp.add(usersEarnedTokensList[i]);
  });

  return Object.fromEntries(
    sumList.map((sum, i) => {
      const parsedSum = parseFloat(formatUnits(sum, options.decimal));
      return [addresses[i], parsedSum];
    })
  );
}
