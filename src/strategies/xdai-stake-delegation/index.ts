import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as xdaiEasyStakingStrategy } from '../xdai-easy-staking';
import { strategy as xdaiPOSDAOStakingStrategy } from '../xdai-posdao-staking';
import { strategy as xdaiStakeHoldersStrategy } from '../xdai-stake-holders';
import { getDelegations } from '../../plugins/delegation/utils';

export const author = 'maxaleks';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const delegations = await getDelegations(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  if (Object.keys(delegations).length === 0) return {};
  console.debug('Delegations', delegations);

  const delegationsArray = Object.values(
    delegations
  ).reduce((a: string[], b: string[]) => a.concat(b));
  const erc20Balances = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    delegationsArray,
    options,
    snapshot
  );
  const easyStakingBalances = await xdaiEasyStakingStrategy(
    space,
    network,
    provider,
    delegationsArray,
    options,
    snapshot
  );
  const posdaoStakingBalances = await xdaiPOSDAOStakingStrategy(
    space,
    network,
    provider,
    delegationsArray,
    options,
    snapshot
  );
  const erc20BalancesOnXdai = await xdaiStakeHoldersStrategy(
    space,
    network,
    provider,
    delegationsArray,
    options,
    snapshot
  );
  console.debug('Delegators ERC20 balances', erc20Balances);
  console.debug('Delegators EasyStaking balances', easyStakingBalances);
  console.debug('Delegators POSDAO Staking balances', posdaoStakingBalances);
  console.debug('Delegators ERC20 balances on xDai', erc20BalancesOnXdai);

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce(
            (a, b) =>
              a +
              erc20Balances[b] +
              easyStakingBalances[b] +
              posdaoStakingBalances[b] +
              erc20BalancesOnXdai[b],
            0
          )
        : 0;
      return [address, addressScore];
    })
  );
}
