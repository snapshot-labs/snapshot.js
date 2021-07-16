import { formatUnits } from '@ethersproject/units';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { multicall } from '../../utils';

export const author = 'kibagateaux';
export const version = '0.1.0';
const abi = [
  'function totalSupply() public returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const poolShares = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  const poolGovTokens = (await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    [options.pool],
    {...options, address: options.governanceToken},
    snapshot
  ))[options.pool];

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const totalPoolShares = await multicall(
    network,
    provider,
    abi,
    [[options.address, 'totalSupply']],
    { blockTag }
  )

  if(!totalPoolShares || !poolGovTokens || !Object.keys(poolShares).length) return {}
  const totalShares = parseFloat(formatUnits(totalPoolShares.toString(), options.decimals))

  return Object.fromEntries(
    Object.entries(poolShares).map((account) => [
      account[0],
      (account[1] / totalShares) * poolGovTokens
    ]
  ))
}
