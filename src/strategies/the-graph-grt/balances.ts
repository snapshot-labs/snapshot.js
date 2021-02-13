import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';
import { GRAPH_NETWORK_SUBGRAPH_URL, GraphAccountScores } from './utils';

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
    params.graphAccounts.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    GRAPH_NETWORK_SUBGRAPH_URL[network],
    balanceParams
  );

  const score: GraphAccountScores = {};
  // console.log('Result: ', JSON.stringify(result, null, 2));

  if (result && result.graphAccounts) {
    result.graphAccounts.forEach((ga) => {
      const balanceScore = BigNumber.from(ga.balance);
      // console.log(ga.id, 'BALANCE SCORE: ', balanceScore.toString());

      score[ga.id] = balanceScore;
    });
  }
  return score || {};
}
