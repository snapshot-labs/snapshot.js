import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import examplesFile from './examples.json';
import aboutFile from './README.md';

export const author = 'ethedev';
export const version = '0.1.0';
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
  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  return Object.fromEntries(
    Object.entries(score).map((address: any) => [
      address[0],
      address[1] > (options.min || 0) ? 1 : 0
    ])
  );
}
