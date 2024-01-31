import { subgraphRequest } from '../utils';
import delegationSubgraphs from '../delegationSubgraphs.json';

export const SNAPSHOT_SUBGRAPH_URL = delegationSubgraphs;
const PAGE_SIZE = 1000;

type Delegation = {
  delegator: string;
  delegate: string;
  space: string;
  timestamp: number;
};

export default async function getDelegatesBySpace(
  network: string,
  space: string,
  snapshot: string | number = 'latest',
  options: any = {}
) {
  const subgraphUrl = options.subgraphUrl || SNAPSHOT_SUBGRAPH_URL[network];
  if (!subgraphUrl) {
    return Promise.reject(
      `Delegation subgraph not available for network ${network}`
    );
  }

  let result: Delegation[] = [];
  const spaceIn = ['', space];
  if (space.includes('.eth')) spaceIn.push(space.replace('.eth', ''));

  while (true) {
    const newResults = await fetchData({
      url: subgraphUrl,
      spaces: spaceIn,
      pivot: result[result.length - 1]?.timestamp || 0,
      snapshot
    });

    result = mergeWithoutDuplicates(result, newResults);

    if (
      newResults.length === PAGE_SIZE &&
      newResults[0].timestamp === newResults[newResults.length - 1].timestamp
    ) {
      throw new Error('Unable to paginate delegation');
    }

    if (newResults.length < PAGE_SIZE) break;
  }

  return result;
}

export function mergeWithoutDuplicates(a: Delegation[], b: Delegation[]) {
  const pivot = a[a.length - 1];
  const pivotDelegations = pivot
    ? filterDelegationsByTimestamp(a, pivot.timestamp)
    : [];

  return a.concat(
    b.filter((d) => !pivotDelegations.some((p) => isSameDelegation(p, d)))
  );
}

function isSameDelegation(a: Delegation, b: Delegation): boolean {
  return (
    a.delegator === b.delegator &&
    a.delegate === b.delegate &&
    a.space === b.space &&
    a.timestamp === b.timestamp
  );
}

function filterDelegationsByTimestamp(results: Delegation[], timestamp: number) {
  return results.filter((r) => r.timestamp === timestamp);
}

async function fetchData({
  url,
  spaces,
  pivot,
  snapshot
}: {
  url: string;
  spaces: string[];
  pivot: number;
  snapshot: string | number;
}): Promise<Delegation[]> {
  const params: any = {
    delegations: {
      __args: {
        where: {
          space_in: spaces,
          timestamp_gte: pivot
        },
        first: PAGE_SIZE,
        skip: 0,
        orderBy: 'timestamp',
        orderDirection: 'asc'
      },
      delegator: true,
      space: true,
      delegate: true,
      timestamp: true
    }
  };

  if (snapshot !== 'latest') {
    params.delegations.__args.block = { number: snapshot };
  }

  return (await subgraphRequest(url, params)).delegations || [];
}
