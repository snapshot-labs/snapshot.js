import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'Badgeth';
export const version = '0.1.0';

const BADGETH_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/hardforksoverknives/badgeth-dev';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const params = {
    voters: {
      __args: {
        where: {
          userAddress_in: addresses.map((address) => address.toLowerCase()),
          balance_gt: 0
        },
        first: 1000,
        orderBy: 'votingPower',
        orderDirection: 'desc'
      },
      id: true,
      votingPower: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.voters.__args.block = { number: snapshot };
  }

  const score = {};
  const result = await subgraphRequest(BADGETH_SUBGRAPH_URL, params);
  if (result && result.voters) {
    result.voters.forEach((voter) => {
      score[voter.id] = voter.votingPower;
    });
  }

  return score || {};
}
