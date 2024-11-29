const snapshot = require('../');

const provider = snapshot.utils.getProvider('11155111');

provider
  .getBlockNumber()
  .then((blockNumber) => console.log('blockNumber', blockNumber));
