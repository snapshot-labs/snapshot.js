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
  space: string | null,
  snapshot: string | number = 'latest',
  options: any = {}
) {
  const subgraphUrl = options.subgraphUrl || SNAPSHOT_SUBGRAPH_URL[network];
  if (!subgraphUrl) {
    return Promise.reject(
      `Delegation subgraph not available for network ${network}`
    );
  }

  let pivot = 0;
  const result = new Map<string, Delegation>();
  const spaceIn = space ? buildSpaceIn(space) : null;

  while (true) {
    const newResults = await fetchData({
      url: subgraphUrl,
      spaces: spaceIn,
      pivot,
      snapshot
    });

    if (checkAllDuplicates(newResults)) {
      throw new Error('Unable to paginate delegation');
    }

    newResults.forEach((delegation) => {
      concatUniqueDelegation(result, delegation);
      pivot = delegation.timestamp;
    });

    if (newResults.length < PAGE_SIZE) break;
  }

  return [...result.values()];
}

function checkAllDuplicates(delegations: Delegation[]) {
  return (
    delegations.length === PAGE_SIZE &&
    delegations[0].timestamp === delegations[delegations.length - 1].timestamp
  );
}

function delegationKey(delegation: Delegation) {
  return `${delegation.delegator}-${delegation.delegate}-${delegation.space}`;
}

function concatUniqueDelegation(
  result: Map<string, Delegation>,
  delegation: Delegation
): void {
  const key = delegationKey(delegation);
  if (!result.has(key)) {
    result.set(key, delegation);
  }
}

function buildSpaceIn(space: string) {
  const spaces = ['', space];
  if (space.includes('.eth')) spaces.push(space.replace('.eth', ''));

  return spaces;
}

async function fetchData({
  url,
  spaces,
  pivot,
  snapshot
}: {
  url: string;
  spaces: string[] | null;
  pivot: number;
  snapshot: string | number;
}): Promise<Delegation[]> {
  const params: any = {
    delegations: {
      __args: {
        where: {
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

  if (spaces !== null) {
    params.delegations.__args.where.space_in = spaces;
  }

  return (await subgraphRequest(url, params)).delegations || [];
}
