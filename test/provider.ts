// This file runs on the compiled files
// Run `yarn build` to compile the TypeScript files before running this file
// Run `yarn ts-node test/provider.ts` to run this file

const snapshot = require('../');

const evmProvider = snapshot.utils.getProvider('1');
const evmRequests = [evmProvider.getNetwork(), evmProvider.getBlockNumber()];

Promise.all(evmRequests).then((results) => {
  console.log('EVM Provider Response:');
  console.log(results);
});

const starknetProvider = snapshot.utils.getProvider('0x534e5f4d41494e');
const starknetRequests = [
  starknetProvider.getChainId(),
  starknetProvider.getBlockNumber()
];

Promise.all(starknetRequests).then((results) => {
  console.log('Starknet Provider Response:');
  console.log(results);
});
