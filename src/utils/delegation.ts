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
  let skip = 0;
  const spaceIn = ['', space];
  if (space.includes('.eth')) spaceIn.push(space.replace('.eth', ''));

  while (true) {
    const newResults = await fetchData({
      url: subgraphUrl,
      spaces: spaceIn,
      first: PAGE_SIZE,
      skip,
      pivot: result[result.length - 1]?.timestamp || 0,
      snapshot
    });

    result = mergeWithoutDuplicates(result, newResults);

    if (
      newResults.length === PAGE_SIZE &&
      newResults[0].timestamp === newResults[newResults.length - 1].timestamp
    ) {
      skip += PAGE_SIZE;
    } else {
      skip = 0;
    }

    if (newResults.length < PAGE_SIZE) break;
  }

  return result;
}

export function mergeWithoutDuplicates(a: Delegation[], b: Delegation[]) {
  const pivot = a[a.length - 1];
  const pivotDelegations = pivot
    ? getDelegationsFromTimestamp(a, pivot.timestamp)
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

function getDelegationsFromTimestamp(results: Delegation[], timestamp: number) {
  return results.filter((r) => r.timestamp === timestamp);
}

async function fetchData({
  url,
  spaces,
  first,
  skip,
  pivot,
  snapshot
}: {
  url: string;
  spaces: string[];
  first: number;
  skip: number;
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
        first,
        skip,
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
