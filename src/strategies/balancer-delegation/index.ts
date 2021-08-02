import { strategy as delegation } from '../delegation';
import examplesFile from './examples.json';

export const author = 'bonustrack';
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
  return await delegation(
    space,
    network,
    provider,
    addresses,
    {
      strategies: [
        {
          name: 'balancer',
          params: options
        }
      ]
    },
    snapshot
  );
}
