import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';
import { GRAPH_NETWORK_SUBGRAPH_URL, WEI, bdToBn, GraphAccountScores } from './utils';

export async function getTokenLockBeneficiaries(
  _space,
  network,
  _provider,
  addresses,
  _options,
  snapshot
): Promise<GraphAccountScores> {
  const tokenLockParams = {
    tokenLockWallets: {
      __args: {
        where: {
          beneficiary_in: addresses.map((address) => address.toLowerCase())
        },
        first: 1000
      },
      id: true,
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.graphAccounts.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    GRAPH_NETWORK_SUBGRAPH_URL[network],
    tokenLockParams
  );
  const score: GraphAccountScores = {};
  // console.log('Result: ', JSON.stringify(result, null, 2));

  if (result && result.tokenLockWallets) {
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

      console.log('DELEGATE SCORE: ', delegationScore.toString());

      score[ga.id] = delegationScore;
    });
  }
  return score || {};
}
