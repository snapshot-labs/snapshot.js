import { balanceStrategy } from './balances';
import { indexersStrategy } from './indexers';
import { delegatorsStrategy } from './delegators';
import { GraphAccountScores } from './utils';

export const author = 'davekaj';
export const version = '0.1.0';

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  _options,
  snapshot
) {



  const balanceScore = await balanceStrategy(
    _space,
    network,
    _provider,
    addresses,
    _options,
    snapshot
  );
  const indexersScore = await indexersStrategy(
    _space,
    network,
    _provider,
    addresses,
    _options,
    snapshot
  );
  const delegatorsScore = await delegatorsStrategy(
    _space,
    network,
    _provider,
    addresses,
    _options,
    snapshot
  );

  const score: GraphAccountScores = {};

  // Add together all the separate scores
  for (const key in balanceScore) {
    score[key] = balanceScore[key].add(indexersScore[key]).add(delegatorsScore[key]);
  }

  // let printBalance = {};
  // let printIndexers = {};
  // let printDelegators = {};
  // let printAll = {};
  // for (const key in balanceScore) {
  //   printBalance[key] = balanceScore[key].toString();
  //   printIndexers[key] = indexersScore[key].toString();
  //   printDelegators[key] = delegatorsScore[key].toString();
  //   printAll[key] = score[key].toString();
  // }
  // console.log('B SCORE: ', printBalance);
  // console.log('I SCORE: ', printIndexers);
  // console.log('D SCORE: ', printDelegators);
  // console.log('TOTAL SCORE: ', printAll);

  return score;
}

/*
name signal query below

{
  graphAccounts(first: 5) {
    id
    curator{
      nameSignals{
        nameSignal
        subgraph{
          id
          nameSignalAmount
          currentVersion{
            subgraphDeployment{
              stakedTokens
              signalledTokens
              signalAmount
            }
          }
        }
      }
    }
  }
}


*/