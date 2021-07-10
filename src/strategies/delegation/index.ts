import { getDelegations } from '../../plugins/delegation/utils';
import { getScoresDirect } from '../../utils';

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

  const scores = (
    await getScoresDirect(
      space,
      options.strategies,
      network,
      provider,
      Object.values(delegations).reduce((a: string[], b: string[]) =>
        a.concat(b)
      ),
      snapshot
    )
  ).filter((score) => Object.keys(score).length !== 0);

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce(
            (a, b) => a + scores.reduce((x, y) => x + y[b] || 0, 0),
            0
          )
        : 0;
      return [address, addressScore];
    })
  );
}
