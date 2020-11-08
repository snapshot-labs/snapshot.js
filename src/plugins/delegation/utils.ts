import { SNAPSHOT_SUBGRAPH_URL, subgraphRequest } from '../../utils';

export async function getDelegations(
  space,
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
          delegator_not_in: addresses.map((address) => address.toLowerCase()),
          space_in: ['', space]
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
  if (!result || !result.delegations) return {};

  const delegationsReverse = {};
  result.delegations.forEach(
    (delegation) =>
      (delegationsReverse[delegation.delegator] = delegation.delegate)
  );
  result.delegations
    .filter((delegation) => delegation.space !== '')
    .forEach(
      (delegation) =>
        (delegationsReverse[delegation.delegator] = delegation.delegate)
    );

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      Object.entries(delegationsReverse)
        .filter(([, delegate]) => address.toLowerCase() === delegate)
        .map(([delegator]) => delegator)
    ])
  );
}
