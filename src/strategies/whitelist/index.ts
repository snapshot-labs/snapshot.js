import examplesFile from './examples.json';

export const author = 'bonustrack';
export const version = '0.1.0';
export const examples = examplesFile;

export async function strategy(space, network, provider, addresses, options) {
  const whitelist = options?.addresses.map((address) => address.toLowerCase());
  return Object.fromEntries(
    addresses.map((address) => [
      address,
      whitelist.includes(address.toLowerCase()) ? 1 : 0
    ])
  );
}
