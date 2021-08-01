import { baseStrategy } from '../the-graph/baseStrategy';
import examplesFile from './examples.json';

export const author = 'davekaj';
export const version = '0.1.0';
export const examples = examplesFile;

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  _options,
  snapshot
) {
  return await baseStrategy(
    _space,
    network,
    _provider,
    addresses,
    _options,
    snapshot
  );
}
