import { EnumType } from 'json-to-graphql-query';
import fetch from 'cross-fetch';
import { subgraphRequest } from '../../utils';

export const author = 'ChaituVR';
export const version = '0.1.0';

const getJWT = async (dfuseApiKey) => {
  const rawResponse = await fetch('https://auth.dfuse.io/v1/auth/issue', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ api_key: dfuseApiKey })
  });
  const content = await rawResponse.json();
  return content.token;
};

export async function strategy(space, network, provider, addresses, options) {
  let data: any = [];
  const query = Object.fromEntries(
    addresses.map((address) => [
      `_${address}`,
      {
        __aliasFor: 'searchTransactions',
        __args: {
          indexName: new EnumType('CALLS'),
          query: `(from:${address} OR to:${address})`,
          sort: new EnumType('ASC'),
          limit: 1
        },
        edges: {
          block: {
            header: {
              timestamp: true
            },
            number: true
          },
          node: {
            from: true,
            to: true
          }
        }
      }
    ])
  );

  const dfuseJWT = await getJWT(
    options.dfuseApiKey || 'web_f527db575a38dd11c5b686d7da54d371'
  );
  data = await subgraphRequest('https://mainnet.eth.dfuse.io/graphql', query, {
    headers: {
      Authorization: `Bearer ${dfuseJWT}`
    }
  });
  return Object.fromEntries(
    Object.values(data).map((value: any, i) => [
      addresses[i],
      (() => {
        const today = new Date().getTime();
        const firstTransaction =
          value.edges[0]?.block?.header?.timestamp || today;
        const diffInSeconds = Math.abs(firstTransaction - today);
        const walletAgeInDays = Math.floor(diffInSeconds / 1000 / 60 / 60 / 24);
        return walletAgeInDays;
      })()
    ])
  );
}
