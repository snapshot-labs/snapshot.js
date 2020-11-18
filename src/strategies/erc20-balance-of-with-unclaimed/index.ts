import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'ncitron';
export const version = '0.0.1';

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
  return score;
}
