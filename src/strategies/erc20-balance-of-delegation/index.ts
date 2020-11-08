import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
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

  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    Object.values(delegations).reduce((a: string[], b: string[]) =>
      a.concat(b)
    ),
    options,
    snapshot
  );

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address.toLowerCase()]
        ? delegations[address.toLowerCase()].reduce((a, b) => a + score[b], 0)
        : 0;
      return [address, addressScore];
    })
  );
}
