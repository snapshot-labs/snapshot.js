import { getAddress } from '@ethersproject/address';
import { SNAPSHOT_SUBGRAPH_URL, subgraphRequest } from '../../utils';

export async function getDelegations(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const addressesLc = addresses.map((addresses) => addresses.toLowerCase());
  const spaceIn = ['', space];
  if (space.includes('.eth')) spaceIn.push(space.replace('.eth', ''));
  const params = {
    delegations: {
      __args: {
        where: {
          // delegate_in: addressesLc,
          // delegator_not_in: addressesLc,
          space_in: spaceIn
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
  if (!result?.delegations) return {};

  const delegations = result.delegations.filter(
    (delegation) =>
      addressesLc.includes(delegation.delegate) &&
      !addressesLc.includes(delegation.delegator)
  );
  if (!delegations) return {};

  const delegationsReverse = {};
  delegations.forEach(
    (delegation) =>
      (delegationsReverse[delegation.delegator] = delegation.delegate)
  );
  delegations
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
        .map(([delegator]) => getAddress(delegator))
    ])
  );
}
