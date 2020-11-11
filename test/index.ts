
const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');
const example = require('../src/strategies/erc20-balance-of/examples.json')[0];
const {signMessage, validateMessage, SigUtilSigner} = require('../src/crypto/index.ts');

(async () => {
  try {
    console.log(example.name);
    console.time('getScores');
    const scores = await snapshot.utils.getScores(
      'yam',
      [example.strategy],
      example.network,
      new JsonRpcProvider(networks[example.network].rpc[0]),
      example.addresses,
      example.snapshot
    );
    //console.log(scores);
    console.timeEnd('getScores');
  } catch (e) {
    console.error(e);
  }
})();

// erc-712 test

(async () => {
  try {
    console.log('start signature ...');
    const web3 = new JsonRpcProvider('http://localhost:7545');
    const message = {
        version: "0.1.3",
        timestamp: 123456789,
        space: "myspace",
        type: "vote",
        payload: "1"};
    const verifyingContract = '0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05';
    const signature = await signMessage(SigUtilSigner('7e91fc4c3424c0594078bcd9c80a7f788ec345e77254e50d3e197e9396e0c472'), message, verifyingContract, 5777);
    const isValid = validateMessage(message, '0x3098C683320703B2B0922f7a2CE67D2ee321EaA9', verifyingContract, 5777, signature);
    console.log('all done!', isValid);
  } catch (e) {
    console.error(e);
  }
})();
