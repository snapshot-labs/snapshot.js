//import { VariableType } from 'json-to-graphql-query';
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

  // Given a POAP and address-tokencount mapping,
  // calculate the weight for this POAP.
  // i.e., assuming POAP #4218 had weight 1.5,
  //       given  {'0x123': 2, '0x456': 4}
  //       return {'0x123': 3, '0x456': 6}
  function applyWeightForPoap(eventName, addressHoldings) {
    const weight = poapWeights[eventName];
    const result = {};

    Object.keys(addressHoldings).map((k) => {
      result[k] = addressHoldings[k] * weight;
    });

    return result;
  }

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

  // helper
  async function returnPromiseWithContext(promise, context) {
    const ret = await promise;
    return { rv: ret, context: context };
  }

  // Prepare to fetch erc721 balances
  const cardBalancePromises: Promise<{ rv: any; context: any }>[] = [];
  Object.keys(curioAddresses).forEach((cardName) =>
    cardBalancePromises.push(
      returnPromiseWithContext(
        erc20BalanceOfStrategy(
          space,
          network,
          provider,
          addresses,
          { address: curioAddresses[cardName], decimals: 0, start: 3678637 },
          snapshot
        ),
        cardName
      )
    )
  );

  // Execute erc20 balance fetch in parallel
  return await Promise.all(cardBalancePromises)
    .then((cardBalances) => {
      // then transform token balance -> vote weight
      const cardBalancesWeighted: Array<any> = [];

      cardBalances.forEach((cb) => {
        const cbWeighted = applyWeightForCard(cb.context, cb.rv);
        console.debug(
          'Weighting for card ' +
            cb.context +
            ':\n' +
            JSON.stringify(cbWeighted, null, 2)
        );
        cardBalancesWeighted.push(cbWeighted);
      });

      return cardBalancesWeighted;
    })
    .then((cardBalancesWeighted) => {
      // finally, sum card balances
      return sumAddressWeights(cardBalancesWeighted);
    });

  //Get supply for each tokenID
  const supply = {};
  Object.keys(options.ids).map(async (id:any) => {
    getTokenSupply.query.token.__args.id = id;
    const supplyResponse = await subgraphRequest( POAP_API_ENDPOINT_URL, getTokenSupply );
    supply[id] = supplyResponse;
  });

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
