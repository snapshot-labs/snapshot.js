import { strategy as xdaiStakersAndHoldersStrategy } from '../xdai-stakers-and-holders';
import examplesFile from './examples.json';

export const author = 'maxaleks';
export const version = '0.1.0';
export const examples = examplesFile;

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
    { ...options, userType: 'stakers' },
    snapshot
  );
}
