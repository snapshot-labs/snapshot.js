import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'andytcf';
export const version = '0.0.1';

const SYNTHETIX_SUBGRAPH_URL = `https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix`;

const quadraticWeighting = (value) => {
  // Scale the value by 100000
  const scaledValue = value * 1e5;
  return Math.sqrt(scaledValue);
};

export async function strategy(
  _space,
  _network,
  _provider,
  addresses,
  _,
  snapshot
) {
  const params = {
    snxholders: {
      __args: {
        where: {
          id_in: addresses.map((address: string) => address.toLowerCase())
        },
        first: 1000
      },
      id: true,
      initialDebtOwnership: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.snxholders.__args.block = { number: snapshot };
  }

  const result = await subgraphRequest(SYNTHETIX_SUBGRAPH_URL, params);
  const score = {};

  if (result && result.snxholders) {
    result.snxholders.forEach((holder) => {
      score[getAddress(holder.id)] = quadraticWeighting(
        parseFloat(formatUnits(holder.initialDebtOwnership.toString(), 27))
      );
    });
  }

  return score || {};
}
