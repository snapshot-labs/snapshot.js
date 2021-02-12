import { getTokenLockWallets } from './tokenLockWallets';
import { balanceStrategy } from './balances';
import { indexersStrategy } from './indexers';
import { delegatorsStrategy } from './delegators';
import { GraphAccountScores, NormalizedScores, WEI } from './utils';

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
  // TODO - if we want to limit sending too many addresses in the request, split up by
  // groups of 200 and batch. do it in utils
  // TODO - name signal, and signal

  addresses = addresses.map((address) => address.toLowerCase());
  const tokenLockWallets = await getTokenLockWallets(
    _space,
    network,
    _provider,
    addresses,
    _options,
    snapshot
  );

  // console.log(
  //   'TOKEN LOCK WALLETS: ',
  //   JSON.stringify(tokenLockWallets, null, 2)
  // );

  // Take the token lock wallets object and turn it into an array, pass it into the other strategies
  const allAccounts = [...addresses];
  for (const beneficiary in tokenLockWallets) {
    tokenLockWallets[beneficiary].forEach((tw) => {
      allAccounts.push(tw);
    });
  }

  const balanceScore = await balanceStrategy(
    _space,
    network,
    _provider,
    allAccounts,
    _options,
    snapshot
  );
  const indexersScore = await indexersStrategy(
    _space,
    network,
    _provider,
    allAccounts,
    _options,
    snapshot
  );
  const delegatorsScore = await delegatorsStrategy(
    _space,
    network,
    _provider,
    allAccounts,
    _options,
    snapshot
  );

  const allScores: GraphAccountScores = {};

  // Add together all the separate scores
  for (const key in balanceScore) {
    allScores[key] = balanceScore[key]
      .add(indexersScore[key])
      .add(delegatorsScore[key]);
  }

  // Combine the Token lock votes into the beneficiaries votes
  const combinedScores: NormalizedScores = {};

  for (const account of addresses) {
    let accountScore = allScores[account];
    // It was found that this beneficiary has token lock wallets, lets add them
    if (tokenLockWallets[account] != null) {
      tokenLockWallets[account].forEach((tw) => {
        accountScore = accountScore.add(allScores[tw]);
      });
    }

    combinedScores[account] = accountScore.div(WEI).toNumber();
  }

  // let printBalance = {};
  // let printIndexers = {};
  // let printDelegators = {};
  // let printAll = {};
  // for (const key in balanceScore) {
  //   printBalance[key] = balanceScore[key].toString();
  //   printIndexers[key] = indexersScore[key].toString();
  //   printDelegators[key] = delegatorsScore[key].toString();
  //   printAll[key] = allScores[key].toString();
  // }
  // console.log('B SCORE: ', printBalance);
  // console.log('I SCORE: ', printIndexers);
  // console.log('D SCORE: ', printDelegators);
  // console.log('TOTAL SCORE: ', printAll);

  return combinedScores;
}
