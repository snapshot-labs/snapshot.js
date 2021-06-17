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
  return Object.fromEntries(
    addresses.map((address) => [address, options.value || 1])
  );
}
