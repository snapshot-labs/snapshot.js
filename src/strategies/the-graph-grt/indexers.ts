import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';
import { GRAPH_NETWORK_SUBGRAPH_URL, GraphAccountScores } from './utils';

export async function indexersStrategy(
  _space,
  network,
  _provider,
  addresses,
  _options,
  snapshot
  ): Promise<GraphAccountScores> {
    const indexersParams = {
    graphAccounts: {
      __args: {
        where: {
          id_in: addresses
        },
        first: 1000
      },
      id: true,
      indexer: {
        stakedTokens: true
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.graphAccounts.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    GRAPH_NETWORK_SUBGRAPH_URL[network],
    indexersParams
  );
  const score: GraphAccountScores = {};
  // console.log('Result: ', JSON.stringify(result, null, 2));

  if (result && result.graphAccounts) {
    result.graphAccounts.forEach((ga) => {
      let indexerScore = BigNumber.from(0);

      if (ga.indexer != null) {
        indexerScore = BigNumber.from(ga.indexer.stakedTokens);
      }
      // console.log(ga.id, 'INDEXER SCORE: ', indexerScore.toString());

      score[ga.id] = indexerScore;
    });
  }
  return score || {};
}
