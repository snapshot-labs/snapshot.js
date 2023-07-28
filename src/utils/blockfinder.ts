import { subgraphRequest } from '../utils';

interface CacheEntry {
  value: any;
  expirationTime: number;
}

const cache: Record<string, CacheEntry> = {};

export async function getSnapshots(network, snapshot, provider, networks) {
  const cacheKey = `${network}-${snapshot}-${networks.join('-')}`;
  const cachedEntry = cache[cacheKey];
  if (cachedEntry && cachedEntry.expirationTime > Date.now()) {
    return cachedEntry.value;
  }
  const snapshots = {};
  networks.forEach((n) => (snapshots[n] = 'latest'));
  if (snapshot === 'latest') return snapshots;
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
  const url = 'https://blockfinder.snapshot.org';
  const data = await subgraphRequest(url, query);
  data.blocks.forEach((block) => (snapshots[block.network] = block.number));
  const expirationTime = Date.now() + 1000 * 60 * 60 * 1; // Cache for 1 hour
  cache[cacheKey] = { value: snapshots, expirationTime };
  return snapshots;
}
