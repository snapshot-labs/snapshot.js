const sigUtil = require('eth-sig-util');
const { keccak } = require('ethereumjs-util');

function getMessageERC712Hash(message, verifyingContract, chainId) {
  const m = prepareMessage(message);
  const { DomainType, MessageType } = getDomainType(
    m,
    verifyingContract,
    chainId
  );
  const msgParams = {
    domain: DomainType,
    message: m,
    primaryType: 'Message',
    types: MessageType
  };
  return '0x' + sigUtil.TypedDataUtils.sign(msgParams).toString('hex');
}

function getDomainType(message, verifyingContract, chainId) {
  switch (message.type) {
    case 'vote':
      return getVoteDomainType(verifyingContract, chainId);
    case 'proposal':
      return getProposalDomainType(verifyingContract, chainId);
    default:
      throw new Error('unknown type ' + message.type);
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
      { name: 'versionHash', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'spaceHash', type: 'string' },
      { name: 'payload', type: 'MessagePayload' },
      { name: 'token', type: 'string' },
      { name: 'type', type: 'string' }
    ],
    MessagePayload: [
      { name: 'choice', type: 'uint256' },
      { name: 'proposal', type: 'string' },
      { name: 'metadataHash', type: 'string' }
    ]
  };

  return { DomainType, MessageType };
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
      { name: 'versionHash', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'spaceHash', type: 'string' },
      { name: 'payload', type: 'MessagePayload' },
      { name: 'token', type: 'string' },
      { name: 'type', type: 'string' }
    ],
    MessagePayload: [
      { name: 'nameHash', type: 'string' },
      { name: 'bodyHash', type: 'string' },
      { name: 'choices', type: 'string[]' },
      { name: 'start', type: 'uint256' },
      { name: 'end', type: 'uint256' },
      { name: 'snapshot', type: 'uint256' },
      { name: 'metadataHash', type: 'string' }
    ]
  };

  return { DomainType, MessageType };
}

async function signMessage(signer, message, verifyingContract, chainId) {
  return signer(message, verifyingContract, chainId);
}

function validateMessage(
  message,
  address,
  verifyingContract,
  chainId,
  signature
) {
  const { DomainType, MessageType } = getDomainType(
    message,
    verifyingContract,
    chainId
  );

  const msgParams = {
    domain: DomainType,
    message,
    primaryType: 'Message',
    types: MessageType
  };

  const recoverAddress = sigUtil.recoverTypedSignature_v4({
    data: msgParams,
    sig: signature
  });
  return address.toLowerCase() === recoverAddress.toLowerCase();
}

function Web3Signer(web3) {
  return function (message, verifyingContract, chainId) {
    const m = prepareMessage(message);
    const { DomainType, MessageType } = getDomainType(
      m,
      verifyingContract,
      chainId
    );
    const signer = web3.getSigner();

    return signer._signTypedData(DomainType, MessageType, m);
  };
}

function SigUtilSigner(privateKeyStr) {
  return function (message, verifyingContract, chainId) {
    const m = prepareMessage(message);
    const privateKey = Buffer.from(privateKeyStr, 'hex');
    const { DomainType, MessageType } = getDomainType(
      m,
      verifyingContract,
      chainId
    );
    const msgParams = {
      domain: DomainType,
      message: m,
      primaryType: 'Message',
      types: MessageType
    };
    return sigUtil.signTypedData_v4(privateKey, { data: msgParams });
  };
}

function prepareMessage(message) {
  switch (message.type) {
    case 'vote':
      return prepareVoteMessage(message);
    case 'proposal':
      return prepareProposalMessage(message);
    default:
      throw new Error('unknown type ' + message.type);
  }
}

function prepareVoteMessage(message) {
  return Object.assign(message, {
    versionHash: hexKeccak(message.version),
    spaceHash: hexKeccak(message.space),
    payload: prepareVotePayload(message.payload)
  });
}

function prepareVotePayload(payload) {
  return Object.assign(payload, {
    metadataHash: hexKeccak(JSON.stringify(payload.metadata))
  });
}

function prepareProposalMessage(message) {
  return Object.assign(message, {
    versionHash: hexKeccak(message.version),
    spaceHash: hexKeccak(message.space),
    payload: prepareProposalPayload(message.payload)
  });
}

function prepareProposalPayload(payload) {
  return Object.assign(payload, {
    nameHash: hexKeccak(payload.name),
    bodyHash: hexKeccak(payload.body),
    metadataHash: hexKeccak(JSON.stringify(payload.metadata))
  });
}

function hexKeccak(obj) {
  return keccak(obj).toString('hex');
}

module.exports = {
  validateMessage,
  getDomainType,
  signMessage,
  Web3Signer,
  SigUtilSigner,
  getMessageERC712Hash
};
