import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { subgraphRequest, SNAPSHOT_SUBGRAPH_URL } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.0';

export async function strategy(
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const params = {
    delegations: {
      __args: {
        where: {
          delegate_in: addresses.map((address) => address.toLowerCase()),
          space: ''
        },
        first: 1000
      },
      delegator: true,
      space: true,
      delegate: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.delegations.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(SNAPSHOT_SUBGRAPH_URL[network], params);
  if (result && result.delegations) {
    const delegators = result.delegations.map(delegation => delegation.delegator);
    const delegatorsByAddress = {};
    result.delegations.forEach(delegation => {
      if (!delegatorsByAddress[delegation.delegate]) delegatorsByAddress[delegation.delegate] = [];
      delegatorsByAddress[delegation.delegate].push(delegation.delegator);
    });
    const score = await erc20BalanceOfStrategy(
      network,
      provider,
      delegators,
      options,
      snapshot
    );
    return Object.fromEntries(addresses.map(address => {
      const addressScore = delegatorsByAddress[address.toLowerCase()]
        ? delegatorsByAddress[address.toLowerCase()].reduce((a, b) => a + score[b], 0)
        : 0;
      return [address, addressScore];
    }));
  }
  return {};
}
