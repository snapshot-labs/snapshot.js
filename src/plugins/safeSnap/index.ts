import { isAddress } from '@ethersproject/address';
import {
  BigNumber,
  isBigNumberish
} from '@ethersproject/bignumber/lib/bignumber';
import { isHexString } from '@ethersproject/bytes';
import { HashZero } from '@ethersproject/constants';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { keccak256 as solidityKeccak256 } from '@ethersproject/solidity';
import { call, multicall, sendTransaction } from '../../utils';
import getProvider from '../../utils/provider';
import { _TypedDataEncoder } from '@ethersproject/hash';
import { formatEther } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';
import { Result } from '@ethersproject/abi';

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
  'function minimumBond() view returns (uint256)',

  // Write functions
  'function addProposal(string proposalId, bytes32[] txHashes)',
  'function executeProposalWithIndex(string proposalId, bytes32[] txHashes, address to, uint256 value, bytes data, uint8 operation, uint256 txIndex)'
];

const OracleAbi = [
  // Events
  `event LogNewAnswer(
    bytes32 answer,
    bytes32 indexed question_id,
    bytes32 history_hash,
    address indexed user,
    uint256 bond,
    uint256 ts,
    bool is_commitment
  )`,

  // Read functions
  'function resultFor(bytes32 question_id) view returns (bytes32)',
  'function getFinalizeTS(bytes32 question_id) view returns (uint32)',
  'function getBond(bytes32 question_id) view returns (uint256)',
  'function getBestAnswer(bytes32 question_id) view returns (uint32)',
  'function balanceOf(address) view returns (uint256)',
  'function getHistoryHash(bytes32 question_id) view returns (bytes32)',
  'function isFinalized(bytes32 question_id) view returns (bool)',

  // Write functions
  'function submitAnswer(bytes32 question_id, bytes32 answer, uint256 max_previous) external payable',
  `function claimMultipleAndWithdrawBalance(
    bytes32[] question_ids, 
    uint256[] lengths, 
    bytes32[] hist_hashes, 
    address[] addrs, 
    uint256[] bonds, 
    bytes32[] answers
  ) public`,
  'function withdraw() public'
];

const START_BLOCKS = {
  1: 6531147,
  4: 3175028
};
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
  currentBond: string | undefined;
  isApproved: boolean;
  endTime: number | undefined;
}

const buildQuestion = async (proposalId: string, txHashes: string[]) => {
  const hashesHash = solidityKeccak256(['bytes32[]'], [txHashes]).slice(2);
  return `${proposalId}␟${hashesHash}`;
};

const getProposalDetails = async (
  provider: StaticJsonRpcProvider,
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
  provider: StaticJsonRpcProvider,
  network: string,
  moduleAddress: string
): Promise<{
  dao: string;
  oracle: string;
  cooldown: number;
  minimumBond: number;
}> => {
  const moduleDetails = await multicall(network, provider, ModuleAbi, [
    [moduleAddress, 'executor'],
    [moduleAddress, 'oracle'],
    [moduleAddress, 'questionCooldown'],
    [moduleAddress, 'minimumBond']
  ]);
  return {
    dao: moduleDetails[0][0],
    oracle: moduleDetails[1][0],
    cooldown: moduleDetails[2][0],
    minimumBond: moduleDetails[3][0]
  };
};

const checkPossibleExecution = async (
  provider: StaticJsonRpcProvider,
  network: string,
  oracleAddress: string,
  questionId: string | undefined
): Promise<{
  executionApproved: boolean;
  finalizedAt: number | undefined;
}> => {
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

const retrieveInfoFromOracle = async (
  provider: StaticJsonRpcProvider,
  network: string,
  oracleAddress: string,
  questionId: string | undefined
): Promise<{
  currentBond: string | undefined;
  isApproved: boolean;
  endTime: number | undefined;
}> => {
  if (questionId) {
    const result = await multicall(network, provider, OracleAbi, [
      [oracleAddress, 'getFinalizeTS', [questionId]],
      [oracleAddress, 'getBond', [questionId]],
      [oracleAddress, 'getBestAnswer', [questionId]]
    ]);

    const currentBond = formatEther(BigNumber.from(result[1][0]));
    const answer = BigNumber.from(result[2][0]);

    return {
      currentBond,
      isApproved: answer.eq(BigNumber.from(1)),
      endTime: BigNumber.from(result[0][0]).toNumber()
    };
  }
  return {
    currentBond: undefined,
    isApproved: false,
    endTime: undefined
  };
};

export default class Plugin {
  public author = 'Gnosis';
  public version = '1.0.0';
  public name = 'SafeSnap';
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
    const provider: StaticJsonRpcProvider = getProvider(network);
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
        // @ts-ignore
        nonce: '0',
        // @ts-ignore
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
    const provider: StaticJsonRpcProvider = getProvider(network);
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
    const infoFromOracle = await retrieveInfoFromOracle(
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
        txHashes,
        ...infoFromOracle
      };
    } catch (e) {
      throw new Error(e);
    }
  }

  async getModuleDetails(network: string, moduleAddress: string) {
    const provider: StaticJsonRpcProvider = getProvider(network);
    return getModuleDetails(provider, network, moduleAddress);
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

  async loadClaimBondData(
    web3: any,
    network: string,
    questionId: string,
    oracleAddress: string
  ) {
    const contract = new Contract(oracleAddress, OracleAbi, web3);
    const provider: StaticJsonRpcProvider = getProvider(network);

    const [
      [userBalance],
      [bestAnswer],
      [historyHash],
      [isFinalized]
    ] = await multicall(network, provider, OracleAbi, [
      [oracleAddress, 'balanceOf', [web3.provider.selectedAddress]],
      [oracleAddress, 'getBestAnswer', [questionId]],
      [oracleAddress, 'getHistoryHash', [questionId]],
      [oracleAddress, 'isFinalized', [questionId]]
    ]);

    const answersFilter = contract.filters.LogNewAnswer(null, questionId);
    const events = await contract.queryFilter(
      answersFilter,
      START_BLOCKS[network]
    );

    const users: Result[] = [];
    const historyHashes: Result[] = [];
    const bonds: Result[] = [];
    const answers: Result[] = [];

    // We need to send the information from last to first
    events.reverse().forEach(({ args }) => {
      users.push(args?.user.toLowerCase());
      historyHashes.push(args?.history_hash);
      bonds.push(args?.bond);
      answers.push(args?.answer);
    });

    const alreadyClaimed = BigNumber.from(historyHash).eq(0);
    const address = web3.provider.selectedAddress.toLowerCase();

    // Check if current user has submitted an answer
    const currentUserAnswers = users.map((user, i) => {
      if (user === address) return answers[i];
    });

    // If the user has answers, check if one of them is the winner
    const votedForCorrectQuestion =
      currentUserAnswers.some((answer) => {
        if (answer) {
          return BigNumber.from(answer).eq(bestAnswer);
        }
      }) && isFinalized;

    // If user has balance in the contract, he should be able to withdraw
    const hasBalance = !userBalance.eq(0) && isFinalized;

    // Remove the first history and add an empty one
    // More info: https://github.com/realitio/realitio-contracts/blob/master/truffle/contracts/Realitio.sol#L502
    historyHashes.shift();
    const firstHash = '0x0000000000000000000000000000000000000000000000000000000000000000' as unknown;
    historyHashes.push(firstHash as Result);

    return {
      canClaim: (!alreadyClaimed && votedForCorrectQuestion) || hasBalance,
      data: {
        length: [bonds.length.toString()],
        historyHashes,
        users,
        bonds,
        answers
      }
    };
  }

  async claimBond(
    web3: any,
    oracleAddress: string,
    questionId: string,
    claimParams: [string[], string[], number[], string[]]
  ) {
    const currentHistoryHash = await call(web3, OracleAbi, [
      oracleAddress,
      'getHistoryHash',
      [questionId]
    ]);

    if (BigNumber.from(currentHistoryHash).eq(0)) {
      const tx = await sendTransaction(
        web3,
        oracleAddress,
        OracleAbi,
        'withdraw',
        []
      );
      const receipt = await tx.wait();
      console.log('[Realitio] executed withdraw:', receipt);
      return;
    }

    const tx = await sendTransaction(
      web3,
      oracleAddress,
      OracleAbi,
      'claimMultipleAndWithdrawBalance',
      [[questionId], ...claimParams]
    );
    const receipt = await tx.wait();
    console.log(
      '[Realitio] executed claimMultipleAndWithdrawBalance:',
      receipt
    );
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

  async voteForQuestion(
    web3: any,
    oracleAddress: string,
    questionId: string,
    minimumBondInDaoModule: string,
    answer: '1' | '0'
  ) {
    const currentBond = await call(web3, OracleAbi, [
      oracleAddress,
      'getBond',
      [questionId]
    ]);

    const minimumBondIsZero = BigNumber.from(minimumBondInDaoModule).eq(0);
    const minimumBond = minimumBondIsZero
      ? 1000000000000000
      : minimumBondInDaoModule;

    const bond = currentBond.eq(BigNumber.from(0))
      ? BigNumber.from(minimumBond)
      : currentBond.mul(2);

    const tx = await sendTransaction(
      web3,
      oracleAddress,
      OracleAbi,
      'submitAnswer',
      [
        questionId,
        `0x000000000000000000000000000000000000000000000000000000000000000${answer}`,
        bond
      ],
      {
        value: bond.toString()
      }
    );
    const receipt = await tx.wait();
    console.log('[DAO module] executed vote on oracle:', receipt);
  }
}
