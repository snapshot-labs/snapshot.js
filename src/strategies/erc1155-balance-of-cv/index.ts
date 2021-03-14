import { strategy as erc1155BalanceOfStrategy } from '../erc1155-balance-of';

export const author = 'dave4506';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const score = await erc1155BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  return Object.fromEntries(
    Object.entries(score).map((address) => [address[0], Math.sqrt(address[1])])
  );
}
