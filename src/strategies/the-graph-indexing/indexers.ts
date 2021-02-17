import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';
import {
  GRAPH_NETWORK_SUBGRAPH_URL,
  GraphAccountScores,
  calcNonStakedTokens,
  WEI
} from '../the-graph/utils';

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
    },
    graphNetworks: {
      totalSupply: true,
      totalDelegatedTokens: true,
      totalTokensStaked: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    indexersParams.graphAccounts.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    GRAPH_NETWORK_SUBGRAPH_URL[network],
    indexersParams
  );
  const score: GraphAccountScores = {};
  console.log('Result: ', JSON.stringify(result, null, 2));

  let normalizationFactor: number;
  if (result && result.graphNetworks) {
    const nonStakedTokens = calcNonStakedTokens(
      result.graphNetworks[0].totalSupply,
      result.graphNetworks[0].totalTokensStaked,
      result.graphNetworks[0].totalDelegatedTokens
    );
    normalizationFactor =
      nonStakedTokens /
      BigNumber.from(result.graphNetworks[0].totalTokensStaked)
        .div(BigNumber.from(WEI))
        .toNumber();
  }
  console.log('Normalization Factor for Indexers: ', normalizationFactor);

  if (result && result.graphAccounts) {
    addresses.forEach((a) => {
      let indexerScore = 0;
      for (let i = 0; i < result.graphAccounts.length; i++) {
        if (result.graphAccounts[i].id == a) {
          if (result.graphAccounts[i].indexer != null) {
            const indexerTokens = BigNumber.from(
              result.graphAccounts[i].indexer.stakedTokens
            );
            indexerScore =
              indexerTokens.div(BigNumber.from(WEI)).toNumber() *
              normalizationFactor;
          }
          break;
        }
      }
      score[a] = indexerScore;
    });
  }
  return score || {};
}
