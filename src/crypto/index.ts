const sigUtil = require('eth-sig-util');
const EIP712Domain = require('eth-typed-data').default;

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

  return { DomainType, VoteType}
}

async function signVoteMessage(signer, vote, verifyingContract, chainId) {
  return signer(vote, verifyingContract, chainId);
}

function validateVote(vote, address, verifyingContract, chainId, signature ) {
  const {DomainType, VoteType} = getVoteDomainType(verifyingContract, chainId); 
  
  const msgParams = {
    domain: DomainType,
    message: vote,
    primaryType: 'Vote',
    types: VoteType
  };
  
  const recoverAddress = sigUtil.recoverTypedSignature_v4({ data: msgParams, sig: signature })
  return address.toLowerCase() === recoverAddress.toLowerCase();
}

function Web3Signer(web3) {
  return function(vote, verifyingContract, chainId) {
    const {DomainType, VoteType} = getVoteDomainType(verifyingContract, chainId);
    const signer = web3.getSigner();
    
    return signer._signTypedData(DomainType, VoteType, vote);
  }
}

function SigUtilSigner(privateKeyStr) {
  return function(vote, verifyingContract, chainId) {
    const privateKey = Buffer.from(privateKeyStr, 'hex');
    const {DomainType, VoteType} = getVoteDomainType(verifyingContract, chainId);
    const msgParams = {
      domain: DomainType,
      message: vote,
      primaryType: 'Vote',
      types: VoteType
    };
    
    return sigUtil.signTypedData(privateKey, {data: msgParams});
  }
}

module.exports = {
  validateVote,
  getVoteDomainType,
  signVoteMessage,
  Web3Signer,
  SigUtilSigner
};