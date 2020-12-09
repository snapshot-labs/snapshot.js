global['fetch'] = require('cross-fetch');
const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');
const example = require('../src/strategies/piedao/examples.json')[0];

(async () => {
  try {
    console.log(example.name);
    console.time('getScores');
    const scores = await snapshot.utils.getScores(
      'piedao',
      [example.strategy],
      example.network,
      new JsonRpcProvider(networks[example.network].rpc[0]),
      example.addresses,
      example.snapshot
    );
    console.log(scores);
    console.timeEnd('getScores');
  } catch (e) {
    console.error(e);
  }
})();
