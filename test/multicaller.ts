const snapshot = require('../');
const abi = require('./ABI.json');
const addresses = require('./addresses.json');
const { Multicaller, getProvider } = snapshot.utils;

const network = '56';
const provider = getProvider(network);
const options = { blockTag: 8400500 };
const pools = [0];
const contract = '0xc80991f9106e26e43bf1c07c764829a85f294c71';

const multi = new Multicaller(network, provider, abi, options);
addresses.forEach(address => {
  pools.forEach(pool => {
    multi.call(`${address}.${pool}`, contract, 'pendingStax', [pool, address]);
  });
});

multi.execute().then(result => {
  console.log('Multicaller result', result);
});
