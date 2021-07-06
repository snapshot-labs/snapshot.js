import { strategy as ethBalanceOfStrategy } from '../eth-balance';

export const author = 'AronVanAmmers';
export const version = '0.1.0';

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
