const sigUtil = require('eth-sig-util');
const EIP712Domain = require('eth-typed-data').default;

function getDomainType(verifyingContract, chainId) {
  const DomainType = {
    name: 'Snapshot Message',
    version: '1',
    chainId,
    verifyingContract
  };

  // The named list of all type definitions
  const MessageType = {
      Message: [
        { name: 'version', type: 'string' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'space', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'payload', type: 'string' }
      ]
  };

  return { DomainType, MessageType}
}

async function signMessage(signer, message, verifyingContract, chainId) {
  return signer(message, verifyingContract, chainId);
}

function validateMessage(message, address, verifyingContract, chainId, signature ) {
  const {DomainType, MessageType} = getDomainType(verifyingContract, chainId); 
  
  const msgParams = {
    domain: DomainType,
    message: message,
    primaryType: 'Message',
    types: MessageType
  };
  
  const recoverAddress = sigUtil.recoverTypedSignature_v4({ data: msgParams, sig: signature })
  return address.toLowerCase() === recoverAddress.toLowerCase();
}

function Web3Signer(web3) {
  return function(message, verifyingContract, chainId) {
    const {DomainType, MessageType} = getDomainType(verifyingContract, chainId);
    const signer = web3.getSigner();
    
    return signer._signTypedData(DomainType, MessageType, message);
  }
}

function SigUtilSigner(privateKeyStr) {
  return function(vote, verifyingContract, chainId) {
    const privateKey = Buffer.from(privateKeyStr, 'hex');
    const {DomainType, MessageType} = getDomainType(verifyingContract, chainId);
    const msgParams = {
      domain: DomainType,
      message: vote,
      primaryType: 'Message',
      types: MessageType
    };
    
    return sigUtil.signTypedData(privateKey, {data: msgParams});
  }
}

module.exports = {
  validateMessage,
  getDomainType,
  signMessage,
  Web3Signer,
  SigUtilSigner
};