import { subgraphRequest } from '../../utils';

export const author = 'dave4506';
export const version = '0.1.0';

export const SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/proofofbeauty/subgraph'
};

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const hashOwnersParams = {
    hashOwners: {
      __args: {
        where: {
          id_in: addresses.map((a) => a.toLowerCase())
        },
        first: 1000 // IS THIS ENOUGH?
      },
      id: true,
      totalQuantity: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    hashOwnersParams.hashOwners.__args.block = { number: snapshot };
  }

  const result = await subgraphRequest(SUBGRAPH_URL[network], hashOwnersParams);

  const scoresMap: { [key: string]: number } = {};

  if (result && result.hashOwners) {
    result.hashOwners.forEach((ow) => {
      if (scoresMap[ow.id] == undefined) scoresMap[ow.id] = 0;
      scoresMap[ow.id] = scoresMap[ow.id] + parseInt(ow.totalQuantity);
    });
  } else {
    console.error('Subgraph request failed');
  }
  const scores: [string, number][] = Object.entries(
    scoresMap
  ).map(([address, score]) => [address, Math.sqrt(score)]);

  return Object.fromEntries(scores);
}
