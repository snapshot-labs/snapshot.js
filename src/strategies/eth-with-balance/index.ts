import { strategy as ethBalanceOfStrategy } from '../eth-balance';
import examplesFile from './examples.json';
import aboutFile from './README.md';

export const author = 'AronVanAmmers';
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
  const score = await ethBalanceOfStrategy(
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
      address[1] > (options.minBalance || 0) ? 1 : 0
    ])
  );
}
