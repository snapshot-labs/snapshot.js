import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';
import {
  GRAPH_NETWORK_SUBGRAPH_URL,
  GraphAccountScores,
  calcNonStakedTokens,
  bnWEI,
  verifyResults
} from '../the-graph/graphUtils';

export async function indexersStrategy(
  _space,
  network,
  _provider,
  addresses,
  options,
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
      __args: {
        first: 1000
      },
      totalSupply: true,
      totalDelegatedTokens: true,
      totalTokensStaked: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    indexersParams.graphAccounts.__args.block = { number: snapshot };
    // @ts-ignore
    indexersParams.graphNetworks.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    GRAPH_NETWORK_SUBGRAPH_URL[network],
    indexersParams
  );
  const score: GraphAccountScores = {};

  let normalizationFactor = 0;
  if (result && result.graphNetworks) {
    const nonStakedTokens = calcNonStakedTokens(
      result.graphNetworks[0].totalSupply,
      result.graphNetworks[0].totalTokensStaked,
      result.graphNetworks[0].totalDelegatedTokens
    );
    normalizationFactor =
      nonStakedTokens /
      BigNumber.from(result.graphNetworks[0].totalTokensStaked)
        .div(bnWEI)
        .toNumber();
  }

  if (options.expectedResults) {
    verifyResults(
      normalizationFactor.toString(),
      options.expectedResults.normalizationFactor.toString(),
      'Normalization factor'
    );
  }

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
              indexerTokens.div(bnWEI).toNumber() * normalizationFactor;
          }
          break;
        }
      }
      score[a] = indexerScore;
    });
  } else {
    console.error('Subgraph request failed');
  }
  return score || {};
}
