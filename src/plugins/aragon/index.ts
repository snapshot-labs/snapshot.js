import BN from 'bn.js';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { sendTransaction, subgraphRequest } from '../../utils';

const ARAGON_SUBGRAPH_URL = {
  '1': 'https://thegraph.com/explorer/subgraph/aragon/aragon-govern-mainnet',
  '4': 'https://thegraph.com/explorer/subgraph/aragon/aragon-govern-rinkeby'
};

const abi = [
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
  }
];

const GQL_QUERY = {
  registryEntry: {
    __args: {
      id: '$daoName'
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
  web3,
  daoName,
  governQueueAddress,
  account,
  proof,
  actionsFromAragonPlugin
) {
  const query = GQL_QUERY;
  query.registryEntry.__args.id = daoName;
  const { registryEntry } = await subgraphRequest(
    ARAGON_SUBGRAPH_URL[4],
    query
  );

  // Building the nonce for the next tx
  const nonce = await web3.nonce();
  const bnNonce = new BN(nonce.toString());
  const newNonce = bnNonce.add(new BN('1'));
  // We also need to get a timestamp bigger or equal to the current block.timestamp + config.executionDelay
  // Right now + execution delay + 60 seconds into the future
  const currentDate =
    Math.round(Date.now() / 1000) +
    Number(registryEntry.queue.config.executionDelay) +
    60;

  return await sendTransaction(
    web3,
    abi,
    governQueueAddress,
    'schedule',
    {
      payload: {
        nonce: newNonce.toString(),
        executionTime: currentDate,
        submitter: account,
        executor: registryEntry.queue.executor.address,
        actions: actionsFromAragonPlugin,
        allowFailuresMap: FAILURE_MAP,
        // proof in snapshot's case, could be the proposal's IPFS CID
        proof: proof ? keccak256(toUtf8Bytes(proof)) : EMPTY_BYTES
      },
      config: {
        executionDelay: registryEntry.config.executionDelay,
        scheduleDeposit: {
          token: registryEntry.queue.config.scheduleDeposit.token.id,
          amount: registryEntry.queue.config.scheduleDeposit.amount
        },
        challengeDeposit: {
          token: registryEntry.queue.config.challengeDeposit.token.id,
          amount: registryEntry.queue.config.challengeDeposit.amount
        },
        resolver: registryEntry.queue.config.resolver,
        rules: registryEntry.queue.config.rules
      }
    },
    {
      // This can probably be optimized
      gasLimit: 500000
    }
  );
}

export default class Plugin {
  public author = 'Evalir';
  public version = '0.1.3';
  public name = 'Aragon Agreements';
  public website = 'https://aragon.org/blog/snapshot';
  public options: any;

  async execute(
    web3,
    spaceOptions,
    proposalOptions,
    proposalId,
    winningChoice
  ) {
    try {
      const account = web3.getAddress();
      return await scheduleAction(
        web3,
        spaceOptions.daoName,
        spaceOptions.governQueueAddress,
        account,
        proposalId,
        proposalOptions[`choice${winningChoice}`]
      );
    } catch (e) {
      console.error(e);
    }
  }
}
