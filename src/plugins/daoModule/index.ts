import { isAddress } from '@ethersproject/address';
import {
  BigNumber,
  isBigNumberish
} from '@ethersproject/bignumber/lib/bignumber';
import { isHexString } from '@ethersproject/bytes';
import { HashZero } from '@ethersproject/constants';
import { JsonRpcProvider } from '@ethersproject/providers';
import { keccak256 as solidityKeccak256 } from '@ethersproject/solidity';
import { multicall, sendTransaction } from '../../utils';
import getProvider from '../../utils/provider';
import { _TypedDataEncoder } from '@ethersproject/hash';

const EIP712_TYPES = {
  Transaction: [
    {
      name: 'to',
      type: 'address'
    },
    {
      name: 'value',
      type: 'uint256'
    },
    {
      name: 'data',
      type: 'bytes'
    },
    {
      name: 'operation',
      type: 'uint8'
    },
    {
      name: 'nonce',
      type: 'uint256'
    }
  ]
};

const ModuleAbi = [
  // Events
  'event ProposalQuestionCreated(bytes32 indexed questionId, string indexed proposalId)',

  // Read functions
  'function executor() view returns (address)',
  'function oracle() view returns (address)',
  'function questionCooldown() view returns (uint32)',
  'function buildQuestion(string proposalId, bytes32[] txHashes) view returns (string)',
  'function executedProposalTransactions(bytes32 questionHash, bytes32 txHash) view returns (bool)',
  'function questionIds(bytes32 questionHash) view returns (bytes32)',

  // Write functions
  'function addProposal(string proposalId, bytes32[] txHashes)',
  'function executeProposalWithIndex(string proposalId, bytes32[] txHashes, address to, uint256 value, bytes data, uint8 operation, uint256 txIndex)'
];

const OracleAbi = [
  // Read functions
  'function resultFor(bytes32 question_id) view returns (bytes32)',
  'function getFinalizeTS(bytes32 question_id) view returns (uint32)'
];

export interface ModuleTransaction {
  to: string;
  value: string;
  data: string;
  operation: string;
  nonce: string;
}

export interface ProposalDetails {
  dao: string;
  oracle: string;
  cooldown: number;
  proposalId: string;
  questionId: string | undefined;
  executionApproved: boolean;
  finalizedAt: number | undefined;
  nextTxIndex: number | undefined;
  transactions: ModuleTransaction[];
  txHashes: string[];
}

const buildQuestion = async (proposalId: string, txHashes: string[]) => {
  const hashesHash = solidityKeccak256(['bytes32[]'], [txHashes]).slice(2);
  return `${proposalId}␟${hashesHash}`;
};

const getProposalDetails = async (
  provider: JsonRpcProvider,
  network: string,
  moduleAddress: string,
  questionHash: string,
  txHashes: string[]
): Promise<{ questionId: string; nextTxIndex: number | undefined }> => {
  const proposalInfo = (
    await multicall(
      network,
      provider,
      ModuleAbi,
      [[moduleAddress, 'questionIds', [questionHash]]].concat(
        txHashes.map((txHash) => [
          moduleAddress,
          'executedProposalTransactions',
          [questionHash, txHash]
        ])
      )
    )
  ).map((res) => res[0]);
  const questionId = proposalInfo[0];
  // We need to offset the index by -1 the first element is the questionId
  const nextIndexToExecute = proposalInfo.indexOf(false, 1) - 1;
  return {
    questionId: questionId !== HashZero ? questionId : undefined,
    nextTxIndex:
      nextIndexToExecute < 0 || nextIndexToExecute >= txHashes.length
        ? undefined
        : nextIndexToExecute
  };
};

const getModuleDetails = async (
  provider: JsonRpcProvider,
  network: string,
  moduleAddress: string
): Promise<{ dao: string; oracle: string; cooldown: number }> => {
  const moduleDetails = await multicall(network, provider, ModuleAbi, [
    [moduleAddress, 'executor'],
    [moduleAddress, 'oracle'],
    [moduleAddress, 'questionCooldown']
  ]);
  return {
    dao: moduleDetails[0][0],
    oracle: moduleDetails[1][0],
    cooldown: moduleDetails[2][0]
  };
};

const checkPossibleExecution = async (
  provider: JsonRpcProvider,
  network: string,
  oracleAddress: string,
  questionId: string | undefined
): Promise<{ executionApproved: boolean; finalizedAt: number | undefined }> => {
  if (questionId) {
    try {
      const result = await multicall(network, provider, OracleAbi, [
        [oracleAddress, 'resultFor', [questionId]],
        [oracleAddress, 'getFinalizeTS', [questionId]]
      ]);
      return {
        executionApproved: BigNumber.from(result[0][0]).eq(BigNumber.from(1)),
        finalizedAt: BigNumber.from(result[1][0]).toNumber()
      };
    } catch (e) {
      // We expect an error while the question is not answered yet
    }
  }
  return {
    executionApproved: false,
    finalizedAt: undefined
  };
};

export default class Plugin {
  public author = 'Gnosis';
  public version = '1.0.0';
  public name = 'Dao Module';
  public website = 'https://safe.gnosis.io';
  public options: any;

  validateTransaction(transaction: ModuleTransaction) {
    return (
      isBigNumberish(transaction.value) &&
      isAddress(transaction.to) &&
      (!transaction.data || isHexString(transaction.data)) &&
      transaction.operation in ['0', '1'] &&
      isBigNumberish(transaction.nonce)
    );
  }

  async calcTransactionHash(
    network: string,
    moduleAddress: string,
    transaction: ModuleTransaction
  ) {
    const provider: JsonRpcProvider = getProvider(network);
    const domain = {
      chainId: provider.network.chainId,
      verifyingContract: moduleAddress
    };
    return _TypedDataEncoder.hash(domain, EIP712_TYPES, transaction);
  }

  async calcTransactionHashes(
    chainId: number,
    moduleAddress: string,
    transactions: ModuleTransaction[]
  ) {
    const domain = {
      chainId: chainId,
      verifyingContract: moduleAddress
    };
    return transactions.map((tx) => {
      const txHash = _TypedDataEncoder.hash(domain, EIP712_TYPES, {
        nonce: '0',
        data: '0x',
        ...tx
      });
      return txHash;
    });
  }

  async getExecutionDetails(
    network: string,
    moduleAddress: string,
    proposalId: string,
    transactions: ModuleTransaction[]
  ): Promise<ProposalDetails> {
    const provider: JsonRpcProvider = getProvider(network);
    const txHashes = await this.calcTransactionHashes(
      provider.network.chainId,
      moduleAddress,
      transactions
    );
    const question = await buildQuestion(proposalId, txHashes);
    const questionHash = solidityKeccak256(['string'], [question]);

    const proposalDetails = await getProposalDetails(
      provider,
      network,
      moduleAddress,
      questionHash,
      txHashes
    );
    const moduleDetails = await getModuleDetails(
      provider,
      network,
      moduleAddress
    );
    const questionState = await checkPossibleExecution(
      provider,
      network,
      moduleDetails.oracle,
      proposalDetails.questionId
    );
    try {
      return {
        ...moduleDetails,
        proposalId,
        ...questionState,
        ...proposalDetails,
        transactions,
        txHashes
      };
    } catch (e) {
      throw new Error(e);
    }
  }

  async submitProposal(
    web3: any,
    moduleAddress: string,
    proposalId: string,
    transactions: ModuleTransaction[]
  ) {
    const txHashes = await this.calcTransactionHashes(
      web3.network.chainId,
      moduleAddress,
      transactions
    );
    const tx = await sendTransaction(
      web3,
      moduleAddress,
      ModuleAbi,
      'addProposal',
      [proposalId, txHashes]
    );
    const receipt = await tx.wait();
    console.log('[DAO module] submitted proposal:', receipt);
  }

  async executeProposal(
    web3: any,
    moduleAddress: string,
    proposalId: string,
    transactions: ModuleTransaction[],
    transactionIndex: number
  ) {
    const txHashes = await this.calcTransactionHashes(
      web3.network.chainId,
      moduleAddress,
      transactions
    );
    const moduleTx = transactions[transactionIndex];
    const tx = await sendTransaction(
      web3,
      moduleAddress,
      ModuleAbi,
      'executeProposalWithIndex',
      [
        proposalId,
        txHashes,
        moduleTx.to,
        moduleTx.value,
        moduleTx.data || '0x',
        moduleTx.operation,
        transactionIndex
      ]
    );
    const receipt = await tx.wait();
    console.log('[DAO module] executed proposal:', receipt);
  }
}
