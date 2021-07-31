import { VariableType } from 'json-to-graphql-query';
import { multicall, subgraphRequest } from '../../utils';

export const author = 'G2 & Torch';
export const version = '1.0.0';
const POAP_API_ENDPOINT_URL =
  'https://api.thegraph.com/subgraphs/name/poap-xyz/poap/graphql';

const abi = [
  'function ownerOf(uint256 tokenId) public view returns (address owner)'
];

// const getTokenSupply = gql`
//   query($tokenId: Number!) {
//     token(id: $tokenId) {
//       totalSupply
//     }
//   }
// `;

const getTokenSupply = {
  query: {
    token: {
      __args: {
        id: undefined
      },
      totalSupply: true
    }
  }
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    abi,
    options.ids.map((id: any) => [options.address, 'ownerOf', [id]]),
    { blockTag }
  );
  const poapWeights = {};
  Object.keys(options.id).map((k) => {
    poapWeights[k] = 1000 / options.id[k];
  });

  //Get supply for each tokenID
  const supply = {};
  Object.keys(options.ids).map((id:any) => {
    getTokenSupply.query.token.__args.id = id;
    const supplyResponse = await subgraphRequest( POAP_API_ENDPOINT_URL, getTokenSupply );
    supply[id] = supplyResponse
  } )

  // return response[0].owner;
  return Object.fromEntries(
    addresses.map((address: any) => [
      address,
      response.findIndex(
        (res: any) => res.owner.toLowerCase() === address.toLowerCase()
      ) > -1
        ? 1
        : 0
    ])
  );
}
