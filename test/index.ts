global['fetch'] = require('cross-fetch');
const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');

/*
## Usage
`npm run test` // Tests default (erc20-balance-of)
`npm run test --strategy=erc20-received`
`npm run test --strategy=eth-balance`
*/

const strategyArg =
  process.env['npm_config_strategy'] ||
  (process.argv.find((arg) => arg.includes('--strategy=')) || '--strategy=erc20-balance-of')
    .split('--strategy=')
    .pop();
const strategy =
  Object.keys(snapshot.strategies).find((s) => strategyArg == s);
if (!strategy) throw 'Strategy not found';
const example = require(`../src/strategies/${strategy}/examples.json`)[0];

(async () => {
  console.log(`Strategy: "${strategy}"`);
  console.log(`Query: "${example.name}"`);
  console.time('getScores');
  try {
    const scores = await snapshot.utils.getScores(
      'yam.eth',
      [example.strategy],
      example.network,
      new JsonRpcProvider(networks[example.network].rpc[0]),
      example.addresses,
      example.snapshot
    );
    console.log(scores);
  } catch (e) {
    console.log('getScores failed');
    console.error(e);
    throw e;
  }
  console.timeEnd('getScores');
})();
