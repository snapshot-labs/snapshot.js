import { subgraphRequest } from '../utils';

export async function getSnapshots(network, snapshot, provider, networks) {
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
  return snapshots;
}
