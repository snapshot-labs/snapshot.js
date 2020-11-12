const sigUtil = require('eth-sig-util');

function getMessageERC712Hash(message, verifyingContract, chainId) {
  const m = Object.assign(message);
    m.payload.metadata = JSON.stringify(message.payload.metadata);
    const {DomainType, MessageType} = getDomainType(m, verifyingContract, chainId);
    const msgParams = {
      domain: DomainType,
      message: m,
      primaryType: 'Message',
      types: MessageType
    };
    return '0x' + sigUtil.TypedDataUtils.sign(msgParams).toString('hex');
}

function getDomainType(message, verifyingContract, chainId) {
  switch(message.type) {
    case "vote":
      return getVoteDomainType(verifyingContract, chainId);
    case "proposal":
      return getProposalDomainType(verifyingContract, chainId);
    default:
      throw new Error("unknown type " + message.type);
  }
 }

function getVoteDomainType(verifyingContract, chainId) {
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
        { name: 'payload', type: 'MessagePayload' }
      ],
      MessagePayload: [
        { name: 'choice', type: 'uint256' },
        { name: 'proposal', type: 'string' },
        { name: 'metadata', type: 'string' }
      ]
  };

  return { DomainType, MessageType}
}

function getProposalDomainType(verifyingContract, chainId) {
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
        { name: 'payload', type: 'MessagePayload' }
      ],
      MessagePayload: [
        { name: 'name', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'choices', type: 'string[]' },
        { name: 'start', type: 'uint256' },
        { name: 'end', type: 'uint256' },
        { name: 'snapshot', type: 'uint256' },
        { name: 'metadata', type: 'string' }
      ]
  };

  return { DomainType, MessageType}
}

async function signMessage(signer, message, verifyingContract, chainId) {
  return signer(message, verifyingContract, chainId);
}

function validateMessage(message, address, verifyingContract, chainId, signature ) {
  const {DomainType, MessageType} = getDomainType(message, verifyingContract, chainId); 
  
  const msgParams = {
    domain: DomainType,
    message,
    primaryType: 'Message',
    types: MessageType
  };
  
  const recoverAddress = sigUtil.recoverTypedSignature_v4({ data: msgParams, sig: signature })
  return address.toLowerCase() === recoverAddress.toLowerCase();
}

function Web3Signer(web3) {
  return function(message, verifyingContract, chainId) {
    const m = Object.assign(message);
    m.payload.metadata = JSON.stringify(message.payload.metadata);
    const {DomainType, MessageType} = getDomainType(m, verifyingContract, chainId);
    const signer = web3.getSigner();
    
    return signer._signTypedData(DomainType, MessageType, m);
  }
}

function SigUtilSigner(privateKeyStr) {
  return function(message, verifyingContract, chainId) {
    const m = Object.assign(message);
    m.payload.metadata = JSON.stringify(message.payload.metadata);
    const privateKey = Buffer.from(privateKeyStr, 'hex');
    const {DomainType, MessageType} = getDomainType(m, verifyingContract, chainId);
    const msgParams = {
      domain: DomainType,
      message: m,
      primaryType: 'Message',
      types: MessageType
    };
    return sigUtil.signTypedData_v4(privateKey, {data: msgParams});
  }
}

module.exports = {
  validateMessage,
  getDomainType,
  signMessage,
  Web3Signer,
  SigUtilSigner,
  getMessageERC712Hash
};