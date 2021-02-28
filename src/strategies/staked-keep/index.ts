import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const KEEP_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/miracle2k/all-the-keeps'
};

export const author = 'corollari';
export const version = '0.1.0';

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  _options,
  snapshot
) {
  const params = {
    operators: {
      __args: {
        where: {
          owner_in: addresses.map((address) => address.toLowerCase())
        },
        first: 1000
      },
      owner: true,
      stakedAmount: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.operators.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(KEEP_SUBGRAPH_URL[network], params);
  const score = {};
  if (result && result.operators) {
    result.operators.forEach((op) => {
      const userAddress = getAddress(op.owner);
      if (!score[userAddress]) score[userAddress] = 0;
      score[userAddress] = score[userAddress] + Number(op.stakedAmount);
    });
  }
  return score;
}
