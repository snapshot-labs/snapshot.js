const snapshot = require('../');

const provider = snapshot.utils.getProvider('1');
const requests = [provider.getNetwork(), provider.getBlockNumber()];

Promise.all(requests).then((results) => {
  console.log(results);
});
