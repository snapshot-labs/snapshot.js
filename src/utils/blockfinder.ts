import { subgraphRequest } from '../utils';

let cache = {};
export async function getSnapshots(network, snapshot, provider, networks) {
  const cacheKey = `${network}-${snapshot}-${networks.join('-')}`;
  if (cache[cacheKey]) return cache[cacheKey];
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
  cache[cacheKey] = snapshots;
  return snapshots;
}

setInterval(() => (cache = {}), 1000 * 60 * 60 * 1); // Clear cache every 1 hour
