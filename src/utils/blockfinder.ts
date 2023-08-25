import { subgraphRequest } from '../utils';

let cache: Record<string, any> = {};
let expirationTime = 0;

export async function getSnapshots(
  network,
  snapshot,
  provider,
  networks,
  options: any = {}
) {
  // If snapshot is latest, return all latest
  const snapshots = {};
  networks.forEach((n) => (snapshots[n] = 'latest'));
  if (snapshot === 'latest') return snapshots;

  // Check if cache is valid
  const cacheKey = `${network}-${snapshot}-${networks.join('-')}`;
  const cachedEntry = cache[cacheKey];
  const now = Date.now();
  if (cachedEntry && expirationTime > now) {
    return cachedEntry;
  }
  // Reset cache every hour
  if (expirationTime < now) {
    cache = {};
    // Set expiration time to next hour
    expirationTime = now + 60 * 60 * 1000 - (now % (60 * 60 * 1000));
  }

  snapshots[network] = snapshot;
  const networkIn = Object.keys(snapshots).filter((s) => network !== s);
  if (networkIn.length === 0) return snapshots;
  const block = await provider.getBlock(snapshot);
  const query = {
    blocks: {
      __args: {
        where: {
          ts: block.timestamp,
          network_in: networkIn
        }
      },
      network: true,
      number: true
    }
  };
  const url = options.blockFinderUrl || 'https://blockfinder.snapshot.org';
  const data = await subgraphRequest(url, query);
  data.blocks.forEach((block) => (snapshots[block.network] = block.number));
  cache[cacheKey] = snapshots;
  return snapshots;
}
