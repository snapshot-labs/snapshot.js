import BN from 'bn.js';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { sendTransaction, subgraphRequest } from '../../utils';
import abi from './GovernQueue.json';

const ARAGON_SUBGRAPH_URL = {
  4: 'https://api.thegraph.com/subgraphs/name/evalir/aragon-govern-rinkeby'
};

const GQL_QUERY = {
  governQueue: {
    __args: {
      id: '0xfc67dd2d7a67bc7b1aa5061c3f4b49f6c3341d00'
    },
    config: {
      executionDelay: true,
      scheduleDeposit: {
        token: {
          id: true
        },
        amount: true
      },
      challengeDeposit: {
        token: {
          id: true
        },
        amount: true
      },
      vetoDeposit: {
        token: {
          id: true
        },
        amount: true
      },
      resolver: true,
      rules: true
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
  governQueueAddress,
  account,
  proof,
  executor,
  actionsFromAragonPlugin
) {
  const config = await subgraphRequest(ARAGON_SUBGRAPH_URL[4], GQL_QUERY);

  // Building the nonce for the next tx
  const nonce = await web3.nonce();
  const bnNonce = new BN(nonce.toString());
  const newNonce = bnNonce.add(new BN('1'));
  // We also need to get a timestamp bigger or equal to the current block.timestamp + config.executionDelay
  // Right now + execution delay + 60 seconds into the future
  const currentDate =
    Math.round(Date.now() / 1000) + Number(config.executionDelay) + 60;

  return await sendTransaction(
    web3,
    abi,
    governQueueAddress,
    'delayExecution',
    {
      payload: {
        nonce: newNonce.toString(),
        executionTime: currentDate,
        submitter: account,
        executor,
        actions: actionsFromAragonPlugin,
        allowFailuresMap: FAILURE_MAP,
        // proof in snapshot's case, could be the proposal's IPFS CID
        proof: proof ? keccak256(toUtf8Bytes(proof)) : EMPTY_BYTES
      },
      config: {
        executionDelay: config.executionDelay,
        scheduleDeposit: {
          token: config.scheduleDeposit.token.id,
          amount: config.scheduleDeposit.amount
        },
        challengeDeposit: {
          token: config.challengeDeposit.token.id,
          amount: config.challengeDeposit.amount
        },
        vetoDeposit: {
          token: config.vetoDeposit.token.id,
          amount: config.vetoDeposit.amount
        },
        resolver: config.resolver,
        rules: config.rules
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

  async execute(web3, options, proposalOptions, id, winningChoice) {
    try {
      const account = '';
      const executor = '';
      return await scheduleAction(
        web3,
        options.governQueueAddress,
        account,
        id,
        executor,
        proposalOptions[`choice${winningChoice}`]
      );
    } catch (e) {
      console.error(e);
    }
  }
}
