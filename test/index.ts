
const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');
const example = require('../src/strategies/erc20-balance-of/examples.json')[0];
const {signMessage, validateMessage, SigUtilSigner, getDomainType, getMessageERC712Hash} = require('../src/crypto/index.ts');
const sigUtil = require('eth-sig-util');

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
  
    const voteMessage = {
      "payload":{
        "choice":1,
        "proposal":"QmcHcqAAz81aaBLtYfepSJGkbSqTfchMs1Qp8TdzMKp9DN",
        "metadata":{
          "memberAddress":"0xDe6ab16a4015c680daab58021815D09ddB57db8E"
        }
      },
      timestamp:1605099139,
      space:"myspace",
      type:"vote",
      version:"0.1.3"
    }

    const chainId = 5777;
    const verifyingContract = '0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05';
    const voteSignature = await signMessage(SigUtilSigner('7e91fc4c3424c0594078bcd9c80a7f788ec345e77254e50d3e197e9396e0c472'), voteMessage, verifyingContract, chainId);
    const isSignatureValid = validateMessage(voteMessage, '0x3098C683320703B2B0922f7a2CE67D2ee321EaA9', verifyingContract, chainId, voteSignature);
    console.log('vote validation:', isSignatureValid);

    const proposalMessage = {
      "payload":{
        "name":"Example Project",
        "body":"xyz\n\nasdasd\n\nasdasd",
        "choices":["Yes","No"],
        "start":1605099037,
        "end":1605131437,
        "snapshot":7529379,
        "metadata":{"uuid":"c51c5424-ea9d-4498-b812-af41da595827"}
      },
      "timestamp":1605099037,
      "space":"myspace",
      "type":"proposal",
      "version":"0.1.3"
    }

    const proposalSignature = await signMessage(SigUtilSigner('7e91fc4c3424c0594078bcd9c80a7f788ec345e77254e50d3e197e9396e0c472'), proposalMessage, verifyingContract, chainId);
    const isProposalValid = validateMessage(proposalMessage, '0x3098C683320703B2B0922f7a2CE67D2ee321EaA9', verifyingContract, chainId, proposalSignature);
    console.log('proposal hash:', getMessageERC712Hash(proposalMessage, verifyingContract, chainId));
    console.log('proposal validation:', isProposalValid);
  } catch (e) {
    console.error(e);
  }
})();
