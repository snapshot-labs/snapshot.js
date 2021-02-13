import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';
import {
  GRAPH_NETWORK_SUBGRAPH_URL,
  WEI,
  bdToBn,
  GraphAccountScores
} from './utils';

export async function delegatorsStrategy(
  _space,
  network,
  _provider,
  addresses,
  _options,
  snapshot
): Promise<GraphAccountScores> {
  const delegatorsParams = {
    graphAccounts: {
      __args: {
        where: {
          id_in: addresses
        },
        first: 1000
      },
      id: true,
      delegator: {
        stakes: {
          shareAmount: true,
          lockedTokens: true,
          indexer: {
            delegationExchangeRate: true
          }
        }
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.graphAccounts.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    GRAPH_NETWORK_SUBGRAPH_URL[network],
    delegatorsParams
  );
  const score: GraphAccountScores = {};
  // console.log('Result: ', JSON.stringify(result, null, 2));

  if (result && result.graphAccounts) {
    result.graphAccounts.forEach((ga) => {
      let delegationScore = BigNumber.from(0);
      if (ga.delegator != null) {
        ga.delegator.stakes.forEach((s) => {
          const derBN = bdToBn(s.indexer.delegationExchangeRate);
          const delegatedTokens = BigNumber.from(s.shareAmount)
            .mul(derBN)
            .div(BigNumber.from(WEI));
          const dScore = delegatedTokens.add(BigNumber.from(s.lockedTokens));
          delegationScore = delegationScore.add(dScore);
        });
      }

      // console.log(ga.id, 'DELEGATE SCORE: ', delegationScore.toString());

      score[ga.id] = delegationScore;
    });
  }
  return score || {};
}
