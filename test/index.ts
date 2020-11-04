global['fetch'] = require('cross-fetch');
const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');
const example = require('../src/strategies/erc20-balance-of-delegation/examples.json')[0];

(async () => {
  try {
    console.time('getScores');
    const scores = await snapshot.utils.getScores(
      [example.strategy],
      example.network,
      new JsonRpcProvider(networks[example.network].rpcUrl),
      example.addresses,
      example.snapshot
    );
    console.log(example.name, scores);
    console.timeEnd('getScores');
  } catch (e) {
    console.error(e);
  }
})();
