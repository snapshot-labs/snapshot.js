import fetch from 'cross-fetch';
import { Web3Provider } from '@ethersproject/providers';
import { ElasticSearchTxResult } from './ElasticSearchTxResult';
export const author = 'mccallofthewild';
export const version = '0.1.0';

export async function strategy(
  ...args: [
    string,
    string,
    Web3Provider,
    string[],
    { coeff?: number; receivingAddresses: string[] },
    number
  ]
) {
  const [, , , addresses, options] = args;
  const { coeff = 1, receivingAddresses } = options;
  // queries AnyBlock ElasticSearch https://www.anyblockanalytics.com/
  // Account: yidirel126@95ta.com Pass: xU5KKfys76wb633FvGS6
  const charitableTransactions: ElasticSearchTxResult = await fetch(
    'https://api.anyblock.tools/ethereum/ethereum/mainnet/es/tx/search/',
    {
      method: 'POST',
      body: JSON.stringify({
        from: 0,
        size: 10000,
        query: {
          bool: {
            must: [
              {
                bool: {
                  should: [
                    ...addresses.map((a) => ({
                      match: {
                        from: a
                      }
                    }))
                  ]
                }
              },
              {
                bool: {
                  should: [
                    ...receivingAddresses.map((a) => ({
                      match: {
                        to: a
                      }
                    }))
                  ]
                }
              }
            ]
          }
        }
      }),
      headers: {
        Authorization: 'Bearer 8c8b3826-afd5-4535-a8be-540562624fbe',
        'Content-Type': 'application/json'
      }
    }
  )
    .then((r) => r.json())
    .catch((e) => {
      console.error('Eth-Received AnyBlock ElasticSearch Query Failed:');
      throw e;
    });

  const scores = {};
  for (const address of addresses) {
    scores[address] = charitableTransactions.hits.hits
      .filter((tx) => {
        const validAddress =
          tx._source.from.toLowerCase() == address.toLowerCase();
        return validAddress;
      })
      .reduce((prev, curr) => {
        return prev + curr._source.value.eth * coeff;
      }, 0);
  }
  return scores;
}
