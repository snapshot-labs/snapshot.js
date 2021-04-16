import { baseStrategy } from '../the-graph/baseStrategy';

export const author = 'davekaj';
export const version = '0.1.0';

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
