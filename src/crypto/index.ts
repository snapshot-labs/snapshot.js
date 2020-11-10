const sigUtil = require('eth-sig-util');

function getVoteDomainType(verifyingContract, chainId) {
  const DomainType = {
    name: 'Snapshot Vote',
    version: '1',
    chainId,
    verifyingContract
  };

  // The named list of all type definitions
  const VoteType = {
      Vote: [
        { name: 'version', type: 'string' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'space', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'payload', type: 'string' }
      ]
  };

  // The data to sign
  const value = {
      from: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
      },
      to: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
      },
      contents: 'Hello, Bob!'
  };
  return { DomainType, VoteType}
}

async function signVoteMessage(web3, vote, verifyingContract, chainId) {  
  const {DomainType, VoteType} = getVoteDomainType(verifyingContract, chainId);

  const signer = web3.getSigner();
  
  return signer._signTypedData(DomainType, VoteType, vote);
}

async function validateVote(vote, address, verifyingContract, chainId, signature ) {
  const {DomainType, VoteType} = getVoteDomainType(verifyingContract, chainId); 

  return address === sigUtil.recoverTypedSignature_v4({ data: "", sig: signature });
}

module.exports = {
  validateVote,
  getVoteDomainType,
  signVoteMessage
};