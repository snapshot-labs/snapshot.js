import { strategy as xdaiStakersAndHoldersStrategy } from '../xdai-stakers-and-holders';

export const author = 'maxaleks';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  return xdaiStakersAndHoldersStrategy(
    space,
    network,
    provider,
    addresses,
    { ...options, userType: 'holders' },
    snapshot
  );
}
