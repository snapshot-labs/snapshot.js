import { strategy as esd } from '../esd';
import { getDelegations } from '../../plugins/delegation/utils';

export const author = 'l3wi';
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

  const score = await esd(
    space,
    network,
    provider,
    Object.values(delegations).reduce((a: string[], b: string[]) =>
      a.concat(b)
    ),
    options,
    snapshot
  );
  console.debug('Delegators score', score);

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce((a, b) => a + score[b], 0)
        : 0;
      return [address, addressScore];
    })
  );
}
