import { subgraphRequest } from '../utils';
import delegationSubgraphs from '../delegationSubgraphs.json';

export const SNAPSHOT_SUBGRAPH_URL = delegationSubgraphs;

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
  const spaceIn = ['', space];
  if (space.includes('.eth')) spaceIn.push(space.replace('.eth', ''));

  const PAGE_SIZE = 1000;
  let result: Delegation[] = [];
  const params: any = {
    delegations: {
      __args: {
        where: {
          space_in: spaceIn
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

  while (true) {
    params.delegations.__args.where.timestamp_gte =
      result[result.length - 1]?.timestamp || 0;

    const newResults: Delegation[] =
      (await subgraphRequest(subgraphUrl, params)).delegations || [];

    result = mergeWithoutDuplicates(result, newResults);

    if (newResults.length < PAGE_SIZE) break;
  }

  return result;
}

export function mergeWithoutDuplicates(a: Delegation[], b: Delegation[]) {
  const pivot = a[a.length - 1];
  const pivotDelegations = pivot
    ? getDelegationFromTimestamp(a, pivot.timestamp)
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

function getDelegationFromTimestamp(results: Delegation[], timestamp: number) {
  return results.filter((r) => r.timestamp === timestamp);
}
