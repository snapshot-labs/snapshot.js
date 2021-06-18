global['fetch'] = require('cross-fetch');
const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');

(async () => {
  console.time('getScores');
  try {
    const scores = await snapshot.utils.mu
  } catch (e) {
    console.log('getScores failed');
    console.error(e);
  }
  console.timeEnd('getScores');
})();
