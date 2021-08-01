import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { getDelegations } from '../../plugins/delegation/utils';
import examplesFile from './examples.json';
import aboutFile from './README.md';

export const author = 'ferittuncer';
export const version = '1.0.0';
export const examples = examplesFile;
export const about = aboutFile;

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
  console.debug('Delegators score', score);

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce(
            (a, b) => (Math.sqrt(a) + Math.sqrt(score[b])) ^ 2,
            0
          )
        : 0;
      return [address, addressScore];
    })
  );
}
