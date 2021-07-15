import fetch from 'cross-fetch';
import { Web3Provider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'mccallofthewild';
export const version = '0.1.0';

export async function strategy(
  ...args: [
    string,
    string,
    Web3Provider,
    string[],
    {
      coeff?: number;
      receivingAddresses: string[];
      contractAddress: string;
      decimals: number;
      dfuseApiKey?: string;
    },
    number
  ]
) {
  const [, , provider, addresses, options] = args;
  const {
    coeff = 1,
    dfuseApiKey = 'server_806bdc9bb370dad11ec5807e82e57fa0',
    receivingAddresses,
    contractAddress,
    decimals
  } = options;

  const loadJWT = async (dfuseApiKey: string): Promise<string> =>
    fetch('https://auth.dfuse.io/v1/auth/issue', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ api_key: dfuseApiKey })
    })
      .then((r) => r.json())
      .then((r) => r.token);

  const {
    data: {
      searchTransactions: { edges }
    }
  } = await fetch('https://mainnet.eth.dfuse.io/graphql', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await loadJWT(dfuseApiKey)}`
    },
    body: JSON.stringify({
      query: /* GraphQL */ `
        query(
          $query: String!
          $sort: SORT
          $low: Int64
          $high: Int64
          $limit: Int64
        ) {
          searchTransactions(
            indexName: LOGS
            query: $query
            sort: $sort
            lowBlockNum: $low
            highBlockNum: $high
            limit: $limit
          ) {
            edges {
              node {
                matchingLogs {
                  topics
                  data
                }
              }
            }
          }
        }
      `,
      variables: {
        query: `address: '${contractAddress}' topic.0:'Transfer(address,address,uint256)' (${addresses
          .map((a) => `topic.1:'${a}'`)
          .join(' OR ')}) (${receivingAddresses
          .map((a) => `topic.2:'${a}'`)
          .join(' OR ')})`,
        sort: 'ASC',
        limit: 0,
        high: await provider.getBlockNumber()
      }
    })
  })
    .then(async (r) => {
      const json = await r.json();
      if (json.errors) throw json.errors;
      return json;
    })
    .catch((e) => {
      console.error(e);
      throw new Error('Strategy ERC20-Received: Dfuse Query Failed');
    });

  const matchingLogs = edges.reduce(
    (prev, edge) => [...prev, ...edge.node.matchingLogs],
    []
  );

  const txLogs: {
    from: string;
    to: string;
    amount: BigNumber;
  }[] = matchingLogs.map((log) => {
    const [, from, to] = log.topics.map((t) =>
      t.replace('0x000000000000000000000000', '0x')
    );
    const amount = BigNumber.from(log.data);
    return {
      from,
      to,
      amount
    };
  });

  const scores = {};
  for (const address of addresses) {
    const logsWithAddress = txLogs.filter((log) => {
      const validAddress = log.from.toLowerCase() == address.toLowerCase();
      return validAddress;
    });
    // Sum of all transfers
    scores[address] = logsWithAddress.reduce((prev, curr) => {
      return (
        prev +
        parseFloat(formatUnits(curr.amount, BigNumber.from(decimals))) * coeff
      );
    }, 0);
  }
  return scores;
}
