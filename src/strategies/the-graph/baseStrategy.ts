import { getTokenLockWallets } from './tokenLockWallets';
import { balanceStrategy } from '../the-graph-balance/balances';
import { indexersStrategy } from '../the-graph-indexing/indexers';
import { delegatorsStrategy } from '../the-graph-delegation/delegators';
import { GraphAccountScores } from './utils';

export async function baseStrategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  addresses = addresses.map((address) => address.toLowerCase());
  const tokenLockWallets = await getTokenLockWallets(
    _space,
    network,
    _provider,
    addresses,
    options,
    snapshot
  );

  // Take the token lock wallets object and turn it into an array, pass it into the other strategies
  const allAccounts = [...addresses];
  for (const beneficiary in tokenLockWallets) {
    tokenLockWallets[beneficiary].forEach((tw) => {
      allAccounts.push(tw);
    });
  }

  let scores: GraphAccountScores;
  if (options.strategyType == 'balance') {
    scores = await balanceStrategy(
      _space,
      network,
      _provider,
      allAccounts,
      options,
      snapshot
    );
  } else if (options.strategyType == 'delegation') {
    scores = await delegatorsStrategy(
      _space,
      network,
      _provider,
      allAccounts,
      options,
      snapshot
    );
  } else if (options.strategyType == 'indexing') {
    scores = await indexersStrategy(
      _space,
      network,
      _provider,
      allAccounts,
      options,
      snapshot
    );
  } else {
    console.error('ERROR: Strategy does not exist');
  }

  console.log(`${options.strategyType} SCORE: `, scores);

  // Combine the Token lock votes into the beneficiaries votes
  const combinedScores: GraphAccountScores = {};
  for (const account of addresses) {
    let accountScore = scores[account];
    // It was found that this beneficiary has token lock wallets, lets add them
    if (tokenLockWallets[account] != null) {
      tokenLockWallets[account].forEach((tw) => {
        accountScore = accountScore + scores[tw];
      });
    }
    combinedScores[account] = accountScore;
  }

  return combinedScores;
}
