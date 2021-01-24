import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as balancerStrategy } from '../balancer';
import { getDelegations } from '../../plugins/delegation/utils';

export const author = 'bonustrack';
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

  const scores = await Promise.all(
    [erc20BalanceOfStrategy, balancerStrategy].map((s) =>
      s(
        space,
        network,
        provider,
        Object.values(delegations).reduce((a: string[], b: string[]) =>
          a.concat(b)
        ),
        options,
        snapshot
      )
    )
  );

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce(
            (a, b) => a + (scores[0][b] || 0) + (scores[1][b] || 0),
            0
          )
        : 0;
      return [address, addressScore];
    })
  );
}
