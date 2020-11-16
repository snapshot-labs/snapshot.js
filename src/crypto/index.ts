const sigUtil = require('eth-sig-util');
const {keccak} = require('ethereumjs-util');

function getMessageERC712Hash(message, verifyingContract, chainId) {
  const m = prepareMessage(message, verifyingContract, chainId);
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
        { name: 'versionHash', type: 'bytes32' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'spaceHash', type: 'bytes32' },
        { name: 'payload', type: 'MessagePayload' }
      ],
      MessagePayload: [
        { name: 'choice', type: 'uint256' },
        { name: 'proposalHash', type: 'bytes32' },
        { name: 'metadataHash', type: 'bytes32' }
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

  const MessageType = {
      Message: [
        { name: 'versionHash', type: 'bytes32' },
        { name: 'timestamp', type: 'uint256' },
        { name: 'spaceHash', type: 'bytes32' },
        { name: 'payload', type: 'MessagePayload' }
      ],
      MessagePayload: [
        { name: 'nameHash', type: 'bytes32' },
        { name: 'bodyHash', type: 'bytes32' },
        { name: 'choices', type: 'string[]' },
        { name: 'start', type: 'uint256' },
        { name: 'end', type: 'uint256' },
        { name: 'snapshot', type: 'uint256' },
        { name: 'metadataHash', type: 'bytes32' }
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
    const m = prepareMessage(message, verifyingContract, chainId);
    const {DomainType, MessageType} = getDomainType(m, verifyingContract, chainId);
    const signer = web3.getSigner();
    
    return signer._signTypedData(DomainType, MessageType, m);
  }
}

function SigUtilSigner(privateKeyStr) {
  return function(message, verifyingContract, chainId) {
    const m = prepareMessage(message, verifyingContract, chainId);
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

function prepareMessage(message, verifyingContract, chainId) {
  switch(message.type) {
    case "vote":
      return prepareVoteMessage(message, verifyingContract, chainId);
    case "proposal":
      return prepareProposalMessage(message);
    default:
      throw new Error("unknown type " + message.type);
  }
}

function prepareVoteMessage(message, verifyingContract, chainId) {
  return Object.assign(message, {
    versionHash: keccak(message.version),
    spaceHash: keccak(message.space),
    payload: prepareVotePayload(message.payload, verifyingContract, chainId)
  });
}

function prepareVotePayload(payload, verifyingContract, chainId) {
  return Object.assign(payload, {
      metadataHash: keccak(JSON.stringify(payload.metadata)),
      proposalHash: getMessageERC712Hash(payload.proposal, verifyingContract, chainId)
  });
}

function prepareProposalMessage(message) {
  return Object.assign(message, {
    versionHash: keccak(message.version),
    spaceHash: keccak(message.space),
    payload: prepareProposalPayload(message.payload)
  });
}

function prepareProposalPayload(payload) {
  return Object.assign(payload, {
      nameHash: keccak(payload.name),
      bodyHash: keccak(payload.body),
      metadataHash: keccak(JSON.stringify(payload.metadata))
  });
}

module.exports = {
  validateMessage,
  getDomainType,
  signMessage,
  Web3Signer,
  SigUtilSigner,
  getMessageERC712Hash
};