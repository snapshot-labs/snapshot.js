import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'noiach';
export const version = '0.1.0';

/*
 * A strategy based on the number of RenVM nodes an address has, and how long
 * each node has been registered for.
 */

const RENVM_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/renproject/renvm',
  '42': 'https://api.thegraph.com/subgraphs/name/renproject/renvm-testnet'
};

// A month in seconds.
const MONTH = 28 * 24 * 60 * 60;

// Subgraph restricts the number of results of a query to 1000 entities.
const QUERY_LIMIT = 1000;

const RENVM_SUBGRAPH_QUERY = {
  darknodes: {
    __args: {
      first: QUERY_LIMIT,
      // Updated each loop.
      skip: 0,
      where: {
        // Skip nodes that have been deregistered.
        registeredAt_gt: 0,
        // Updated below.
        registeredAt_lte: undefined
      }
    },
    registeredAt: true,
    deregisteredAt: true,
    operator: true
  }
};

interface SubgraphDarknode {
  registeredAt: number;
  deregisteredAt: number;
  operator: string;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  if (snapshot !== 'latest') {
    // @ts-ignore
    RENVM_SUBGRAPH_QUERY.darknodes.__args.block = { number: snapshot };
  }

  // Filter out nodes that are still pending registration.
  let timestamp = (await provider.getBlock(snapshot)).timestamp;
  RENVM_SUBGRAPH_QUERY.darknodes.__args.where.registeredAt_lte = timestamp;

  let nodes: SubgraphDarknode[] = [];
  // Loop through to fetch all `darknode` entities. At the time of writing, two
  // requests are required.
  while (nodes.length < 10000) {
    // Skip the number nodes already seen.
    RENVM_SUBGRAPH_QUERY.darknodes.__args.skip = nodes.length;
    const result = await subgraphRequest(
      RENVM_SUBGRAPH_URL[network],
      RENVM_SUBGRAPH_QUERY
    );
    if (result && result.darknodes) {
      nodes = nodes.concat(result.darknodes);
    } else {
      break;
    }

    // If the number of results returned was less than QUERY_LIMIT, then there
    // are no more results to fetch.
    if (result.darknodes.length < QUERY_LIMIT) {
      break;
    }
  }

  // Initialize scores to 0 for each address in `addresses`.
  const scores = addresses.reduce(
    (obj, address) => ({ ...obj, [getAddress(address)]: 0 }),
    {}
  );
  nodes.forEach((darknode) => {
    // Skip operators that aren't in `addresses`.
    const nodeOperator = getAddress(darknode.operator);
    if (scores[nodeOperator] === undefined) {
      return;
    }

    // Check that the darknode isn't deregistered.
    if (darknode.deregisteredAt > 0 && darknode.deregisteredAt < timestamp) {
      return;
    }

    // Take square root of the number of months (rounded up) the node has been
    // registered for.
    const timeRegistered = timestamp - darknode.registeredAt;
    const score = Math.sqrt(Math.ceil(timeRegistered / MONTH));

    scores[nodeOperator] += score;
  });
  return scores;
}
