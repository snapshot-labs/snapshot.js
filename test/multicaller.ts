const snapshot = require('../');
const abi = require('./ABI.json');
const addresses = require('./addresses.json');
const { Multicaller, getProvider } = snapshot.utils;

const network = '56';
const provider = getProvider(network);
const options = { blockTag: 8402249 };
const contract = '0xc80991f9106e26e43bf1c07c764829a85f294c71';

function next(addressIndex) {
  const address = addresses[addressIndex];

  if (!address) {
    console.log('All good!');
    return;
  }

  const multi = new Multicaller(network, provider, abi, options);

  for (let i = 0; i < 20; i++) {
    multi.call(`${address}[${i}]`, contract, 'pendingStax', [i, address]);
  }

  multi.execute().then(results => {
    const balances = results[address].map(balance => balance.toString());
    console.log('Balances for', address, balances);
    next(addressIndex + 1);
  });
}

next(0);
