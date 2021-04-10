import { subgraphRequest } from '../../utils';

export const author = 'dave4506';
export const version = '0.1.1';

export const SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/proofofbeauty/hash'
};

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // ran into issues where returning the score map in lowercase wouldn't match the connected addresses hex string
  const lowerCasedAddressToOriginalAddressMap = Object.fromEntries(
    new Map<string, string>(addresses.map((a) => [a.toLowerCase(), a]))
  );
  const hashOwnersParams = {
    hashOwners: {
      __args: {
        where: {
          id_in: Object.keys(lowerCasedAddressToOriginalAddressMap)
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
      const id = lowerCasedAddressToOriginalAddressMap[ow.id];
      if (scoresMap[id] == undefined) scoresMap[id] = 0;
      scoresMap[id] = scoresMap[id] + parseInt(ow.totalQuantity);
    });
  } else {
    console.error('Subgraph request failed');
  }
  const scores: [string, number][] = Object.entries(
    scoresMap
  ).map(([address, score]) => [address, score]);

  return Object.fromEntries(scores);
}
