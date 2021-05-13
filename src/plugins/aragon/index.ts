import { BigNumber } from '@ethersproject/bignumber';
import { toUtf8Bytes } from '@ethersproject/strings';
import { call, sendTransaction, subgraphRequest } from '../../utils';

const NO_TOKEN = `${'0x'.padEnd(42, '0')}`;

const ARAGON_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/aragon/aragon-govern-mainnet',
  '4': 'https://api.thegraph.com/subgraphs/name/aragon/aragon-govern-rinkeby'
};

const queueAbi = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'uint256',
                name: 'nonce',
                type: 'uint256'
              },
              {
                internalType: 'uint256',
                name: 'executionTime',
                type: 'uint256'
              },
              {
                internalType: 'address',
                name: 'submitter',
                type: 'address'
              },
              {
                internalType: 'contract IERC3000Executor',
                name: 'executor',
                type: 'address'
              },
              {
                components: [
                  {
                    internalType: 'address',
                    name: 'to',
                    type: 'address'
                  },
                  {
                    internalType: 'uint256',
                    name: 'value',
                    type: 'uint256'
                  },
                  {
                    internalType: 'bytes',
                    name: 'data',
                    type: 'bytes'
                  }
                ],
                internalType: 'struct ERC3000Data.Action[]',
                name: 'actions',
                type: 'tuple[]'
              },
              {
                internalType: 'bytes32',
                name: 'allowFailuresMap',
                type: 'bytes32'
              },
              {
                internalType: 'bytes',
                name: 'proof',
                type: 'bytes'
              }
            ],
            internalType: 'struct ERC3000Data.Payload',
            name: 'payload',
            type: 'tuple'
          },
          {
            components: [
              {
                internalType: 'uint256',
                name: 'executionDelay',
                type: 'uint256'
              },
              {
                components: [
                  {
                    internalType: 'address',
                    name: 'token',
                    type: 'address'
                  },
                  {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256'
                  }
                ],
                internalType: 'struct ERC3000Data.Collateral',
                name: 'scheduleDeposit',
                type: 'tuple'
              },
              {
                components: [
                  {
                    internalType: 'address',
                    name: 'token',
                    type: 'address'
                  },
                  {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256'
                  }
                ],
                internalType: 'struct ERC3000Data.Collateral',
                name: 'challengeDeposit',
                type: 'tuple'
              },
              {
                internalType: 'address',
                name: 'resolver',
                type: 'address'
              },
              {
                internalType: 'bytes',
                name: 'rules',
                type: 'bytes'
              }
            ],
            internalType: 'struct ERC3000Data.Config',
            name: 'config',
            type: 'tuple'
          }
        ],
        internalType: 'struct ERC3000Data.Container',
        name: '_container',
        type: 'tuple'
      }
    ],
    name: 'schedule',
    outputs: [
      {
        internalType: 'bytes32',
        name: 'containerHash',
        type: 'bytes32'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'nonce',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const ercAbi = [
  {
    constant: false,
    inputs: [
      {
        name: '_spender',
        type: 'address'
      },
      {
        name: '_value',
        type: 'uint256'
      }
    ],
    name: 'approve',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address'
      },
      {
        name: '_spender',
        type: 'address'
      }
    ],
    name: 'allowance',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

const GQL_QUERY = {
  registryEntry: {
    __args: {
      id: undefined
    },
    executor: {
      address: true
    },
    queue: {
      address: true,
      config: {
        executionDelay: true,
        scheduleDeposit: {
          token: true,
          amount: true
        },
        challengeDeposit: {
          token: true,
          amount: true
        },
        resolver: true,
        rules: true
      }
    }
  }
};

const FAILURE_MAP =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
const EMPTY_BYTES = '0x00';

/**
 * scheduleAction schedules an action into a GovernQueue.
 * Instead of sending the action to a disputable delay from aragonOS, we directly call this
 * contract.
 * the actionsFromAragonPlugin is an array of objects with the form { to, value, data }
 */
async function scheduleAction(
  network,
  web3,
  daoName,
  account,
  proof,
  actionsFromAragonPlugin
) {
  const query = GQL_QUERY;
  query.registryEntry.__args.id = daoName;
  const result = await subgraphRequest(ARAGON_SUBGRAPH_URL[network], query);
  const config = result.registryEntry.queue.config;

  // Building the nonce for the next tx
  const nonce = await call(web3, queueAbi, [
    result.registryEntry.queue.address,
    'nonce'
  ]);
  const bnNonce = BigNumber.from(nonce);
  const newNonce = bnNonce.add(BigNumber.from(1));
  // We also need to get a timestamp bigger or equal to the current block.timestamp + config.executionDelay
  // Right now + execution delay + 60 seconds into the future
  const currentDate =
    Math.round(Date.now() / 1000) + Number(config.executionDelay) + 60;

  const allowance = await call(web3, ercAbi, [
    config.scheduleDeposit.token,
    'allowance',
    [account, result.registryEntry.queue.address]
  ]);

  // First, let's handle token approvals.
  // There are 3 cases to check
  // 1. The user has more allowance than needed, we can skip. (0 tx)
  // 2. The user has less allowance than needed, and we need to raise it. (2 tx)
  // 3. The user has 0 allowance, we just need to approve the needed amount. (1 tx)
  if (
    allowance.lt(config.scheduleDeposit.amount) &&
    config.scheduleDeposit.token !== NO_TOKEN
  ) {
    if (!allowance.isZero()) {
      const resetTx = await sendTransaction(
        web3,
        config.scheduleDeposit.token,
        ercAbi,
        'approve',
        [result.registryEntry.queue.address, '0']
      );
      await resetTx.wait(1);
    }

    await sendTransaction(
      web3,
      config.scheduleDeposit.token,
      ercAbi,
      'approve',
      [result.registryEntry.queue.address, config.scheduleDeposit.amount]
    );
  }

  return await sendTransaction(
    web3,
    result.registryEntry.queue.address,
    queueAbi,
    'schedule',
    [
      {
        payload: {
          nonce: newNonce.toString(),
          executionTime: currentDate,
          submitter: account,
          executor: result.registryEntry.executor.address,
          actions: actionsFromAragonPlugin,
          allowFailuresMap: FAILURE_MAP,
          // proof in snapshot's case, could be the proposal's IPFS CID
          proof: proof ? toUtf8Bytes(proof) : EMPTY_BYTES
        },
        config: {
          executionDelay: config.executionDelay,
          scheduleDeposit: {
            token: config.scheduleDeposit.token,
            amount: config.scheduleDeposit.amount
          },
          challengeDeposit: {
            token: config.challengeDeposit.token,
            amount: config.challengeDeposit.amount
          },
          resolver: config.resolver,
          rules: config.rules
        }
      }
    ],
    {
      // This can probably be optimized
      gasLimit: 500000
    }
  );
}

export default class Plugin {
  public author = 'Evalir';
  public version = '0.1.3';
  public name = 'Aragon Govern';
  public website = 'https://aragon.org/blog/snapshot';
  public options: any;

  async action(
    network,
    web3,
    spaceOptions,
    proposalOptions,
    proposalId,
    winningChoice
  ) {
    try {
      const [account] = await web3.listAccounts();
      return await scheduleAction(
        network,
        web3,
        spaceOptions.id,
        account,
        proposalId,
        proposalOptions[`choice${winningChoice}`].actions
      );
    } catch (e) {
      console.error(e);
    }
  }
}
