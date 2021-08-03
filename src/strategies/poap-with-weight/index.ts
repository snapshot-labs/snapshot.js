import { id } from '@ethersproject/hash';
import { multicall, subgraphRequest } from '../../utils';

export const author = 'G2 & Torch';
export const version = '1.0.0';

const POAP_API_ENDPOINT_URL =
  'https://api.thegraph.com/subgraphs/name/poap-xyz/poap/graphql';

const abi = [
  'function ownerOf(uint256 tokenId) public view returns (address owner)'
];

const getTokenSupply = {
  query: {
    tokens: {
      __args: {
        where: {
          id_in: undefined
        }
      },
      event: {
        tokenCount: true
      },
      id: true,
      owner: {
        id: true
      }
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
    options.tokenIds.map((id: any) => [options.address, 'ownerOf', [id]]),
    { blockTag }
  );
  // Set TokenIds as arguments for GQL query
  getTokenSupply.query.tokens.__args.where.id_in = options.tokenIds;
  const poapWeights = {};
  const supplyResponse = await subgraphRequest(
    POAP_API_ENDPOINT_URL,
    getTokenSupply
  );
  // Given a POAP and address-tokencount mapping,
  // calculate the weight for this POAP.
  // i.e., assuming POAP #4218 had weight 1.5,
  //       given  {'0x123': 2, '0x456': 4}
  //       return {'0x123': 3, '0x456': 6}
  if (supplyResponse && supplyResponse.token) {
    poapWeights[supplyResponse.token.owner.id] =
      1000 * parseInt(supplyResponse.token.event.tokenCount);
  }
  return Object.keys(poapWeights[supplyResponse.token.owner.id]).forEach(
    (key) => {
      const value = poapWeights[supplyResponse.token.owner.id][key];
      // Sums multiple address-voteweight mappings into a single object.
      // i.e., given [{'0x123': 1, '0x456': 2}, {'0x123': 10, '0x456': 20}]
      //       return {'0x123': 11, '0x456': 22}
      function sumAddressWeights(arrayOfWeights) {
        return arrayOfWeights.reduce((sum, current) => {
          for (const k in current) {
            sum[k] = (sum[k] || 0) + current[k];
          }
          return sum;
        }, {});
      }

      // return response[0].owner;
      return Object.fromEntries(
        addresses.map(
          (address: any) => [
            address,
            response.findIndex(
              (res: any) => res.owner.toLowerCase() === address.toLowerCase()
            ) > -1
              ? 1
              : 0
          ],
          sumAddressWeights(value)
        )
      );
    }
  );
}
