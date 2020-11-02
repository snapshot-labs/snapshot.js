import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'BenjaminLu';
export const version = '0.1.0';

export async function strategy(
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const score = await erc20BalanceOfStrategy(
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  return Object.fromEntries(
    Object.entries(score).map((address: any) => [
      address[0],
      address[1] > 0 ? 1 : 0
    ])
  );
}
