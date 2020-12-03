const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');
const example = require('../src/strategies/erc20-balance-of/examples.json')[0];
const {
  signMessage,
  validateMessage,
  SigUtilSigner,
  getDomainType,
  getMessageERC712Hash
} = require('../src/crypto/index.ts');
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

    const chainId = 5777;
    const verifyingContract = '0xcFc2206eAbFDc5f3d9e7fA54f855A8C15D196c05';
    const proposalIpfs = 'QmcHcqAAz81aaBLtYfepSJGkbSqTfchMs1Qp8TdzMKp9DN';
    const address = '0x3098C683320703B2B0922f7a2CE67D2ee321EaA9';
    const timestamp = (Date.now() / 1e3).toFixed();

    const proposalMessage = {
      address: address,
      msg: {
        payload: {
          name: 'Example Project',
          body: 'xyz\n\nasdasd\n\nasdasd',
          choices: ['Yes', 'No'],
          start: 1605099037,
          end: 1605131437,
          snapshot: 7529379,
          metadata: {
            uuid: 'c51c5424-ea9d-4498-b812-af41da595827',
            private: false,
            type: 'Governance',
            subType: 'Governance'
          }
        },
        timestamp: timestamp,
        token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
        space: 'myspace',
        type: 'proposal',
        version: '0.1.3',
        chainId: chainId,
        verifyingContract: verifyingContract
      }
    };

    const proposalSignature = await signMessage(
      SigUtilSigner(
        '7e91fc4c3424c0594078bcd9c80a7f788ec345e77254e50d3e197e9396e0c472'
      ),
      proposalMessage.msg,
      proposalMessage.msg.verifyingContract,
      proposalMessage.msg.chainId
    );
    const newMsg = {
      ...proposalMessage,
      sig: proposalSignature,
      msg: JSON.stringify(proposalMessage.msg)
    };

    console.log('[msg][proposal] => ', JSON.stringify(newMsg));
    const isProposalValid = validateMessage(
      proposalMessage.msg,
      proposalMessage.address,
      proposalMessage.msg.verifyingContract,
      proposalMessage.msg.chainId,
      proposalSignature
    );
    console.log(
      'proposal hash:',
      getMessageERC712Hash(
        proposalMessage.msg,
        proposalMessage.msg.verifyingContract,
        proposalMessage.msg.chainId
      )
    );
    console.log('proposal validation:', isProposalValid);

    const voteMessage = {
      address: address,
      msg: {
        payload: {
          choice: 1,
          proposal: proposalIpfs, //we dont need to pass the entire proposal obj
          metadata: {
            memberAddress: '0xDe6ab16a4015c680daab58021815D09ddB57db8E'
          }
        },
        timestamp: timestamp,
        token: '0x8f56682a50becb1df2fb8136954f2062871bc7fc',
        space: 'myspace',
        type: 'vote',
        version: '0.1.3',
        chainId: chainId,
        verifyingContract: verifyingContract
      }
    };

    const voteMsg = { ...voteMessage.msg };

    const voteSignature = await signMessage(
      SigUtilSigner(
        '7e91fc4c3424c0594078bcd9c80a7f788ec345e77254e50d3e197e9396e0c472'
      ),
      voteMsg,
      voteMsg.verifyingContract,
      voteMsg.chainId
    );
    const isVoteValid = validateMessage(
      voteMessage.msg,
      voteMessage.address,
      voteMessage.msg.verifyingContract,
      voteMessage.msg.chainId,
      voteSignature
    );
    const newVoteMsg = {
      ...voteMessage,
      sig: voteSignature,
      msg: JSON.stringify(voteMessage.msg)
    };
    console.log('[msg][vote] => ', JSON.stringify(newVoteMsg));
    console.log(
      'vote hash:',
      getMessageERC712Hash(
        voteMessage.msg,
        voteMessage.msg.verifyingContract,
        voteMessage.msg.chainId
      )
    );
    console.log('vote validation:', isVoteValid);
  } catch (e) {
    console.error(e);
  }
})();
