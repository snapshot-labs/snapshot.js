import fetch from 'cross-fetch';
import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'benlyaunzon';
export const version = '0.1.0';

const ZRX_STAKING_POOLS = {
  '1': 'https://api.0x.org/staking/pools',
  '42': 'https://staging.api.0x.org/staking/pools'
};

const abi = [
  'function getVotingPower(address account, bytes32[] operatedPoolIds) view returns (uint256 votingPower)'
];

const encodePoolId = (poolId: number) =>
  `0x${poolId.toString(16).padStart(64, '0')}`;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Early return 0 voting power if governanceContract not correctly set
  if (!options.governerContract) {
    return Object.fromEntries(addresses.map((address) => [address, '0']));
  }

  const erc20Balances = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const zrxStakingPoolsRes = await fetch(ZRX_STAKING_POOLS[network]);
  const { stakingPools } = await zrxStakingPoolsRes.json();
  const response: BigNumber[] = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => {
      const addressOperatedPools = stakingPools.filter(
        (p) => p.operatorAddress.toLowerCase() === address.toLowerCase()
      );

      const pools = addressOperatedPools
        ? addressOperatedPools.map((pool) =>
            encodePoolId(parseInt(pool.poolId, 10))
          )
        : [];
      return [
        options.governerContract,
        'getVotingPower',
        [address.toLowerCase(), pools]
      ];
    }),
    { blockTag }
  );

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals)) +
        erc20Balances[addresses[i]]
    ])
  );
}
