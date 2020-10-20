import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'jxde';
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
    Object.entries(score).map((address) => [address[0], options.coeff])
  );
}