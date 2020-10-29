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
          delegate_in: addresses.map((address) => address.toLowerCase())
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
  const score = {};
  if (result && result.delegations) {
    console.log(result.delegations);
  }
  return score || {};
}
