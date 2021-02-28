import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';
import {
  GRAPH_NETWORK_SUBGRAPH_URL,
  GraphAccountScores,
  bnWEI
} from '../the-graph/graphUtils';

export async function balanceStrategy(
  _space,
  network,
  _provider,
  addresses,
  _options,
  snapshot
): Promise<GraphAccountScores> {
  const balanceParams = {
    graphAccounts: {
      __args: {
        where: {
          id_in: addresses
        },
        first: 1000
      },
      id: true,
      balance: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    balanceParams.graphAccounts.__args.block = { number: snapshot };
  }
  // If we want to limit sending too many addresses in the request, split up by
  // groups of 200 and batch. Something to consider for the future
  const result = await subgraphRequest(
    GRAPH_NETWORK_SUBGRAPH_URL[network],
    balanceParams
  );

  // No normalization factor for balances. 1 GRT in wallet is the baseline to compare
  // Delegators and Indexers to.
  const score: GraphAccountScores = {};
  if (result && result.graphAccounts) {
    // Must iterate on addresses since the query can return nothing for a beneficiary that has
    // only interacted through token lock wallets
    addresses.forEach((a) => {
      let balanceScore = 0;
      for (let i = 0; i < result.graphAccounts.length; i++) {
        if (result.graphAccounts[i].id == a) {
          balanceScore = BigNumber.from(result.graphAccounts[i].balance)
            .div(bnWEI)
            .toNumber();
          break;
        }
      }
      score[a] = balanceScore;
    });
  } else {
    console.error('Subgraph request failed');
  }
  return score || {};
}
