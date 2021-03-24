global['fetch'] = require('cross-fetch');
const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');

/*
## Usage
`npm run test` // Tests default (erc20-balance-of)
`npm run test --strategy=erc20-received`
`npm run test --strategy=eth-balance`
`npm run test --strategy=all` (to run all strategies)
*/

let testStrategies = Object.keys(snapshot.strategies);

// to test files changed inside a PR
const filesChangedArg =
  (process.env['npm_config_filesChanged'] ||
  (process.argv.find((arg) => arg.includes('--filesChanged=')) || '')
    .split('--filesChanged=')
    .pop()).replace('"', '');

if(filesChangedArg) {
  testStrategies = filesChangedArg.split('\\n').map(path => path.substring(0, path.lastIndexOf("/")).replace(/src\/strategies\/?/, '')).filter((value, index, array) => { 
    return value && array.indexOf(value) == index;
  })
}

const strategyArg =
  process.env['npm_config_strategy'] ||
  (process.argv.find((arg) => arg.includes('--strategy=')) || '')
    .split('--strategy=')
    .pop();

if(!filesChangedArg && strategyArg !== 'all'){
  testStrategies = [testStrategies.find((s) => strategyArg == s) || 'erc20-balance-of'];
}

(async () => {
for (const newStrategy of testStrategies) {
    console.log(`Strategy: "${newStrategy}"`);
    console.log(newStrategy);
    console.time('getScores');
    try {
      const example = require(`../src/strategies/${newStrategy}/examples.json`)[0];
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
    }
    console.timeEnd('getScores');
  }
})();

