import fetch from 'cross-fetch';
import { InfuraProvider, Web3Provider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { createDfuseClient } from '@dfuse/client';

// @ts-ignore
if (!global.WebSocket) {
  // @ts-ignore
  global.WebSocket = require('ws');
}

const client = createDfuseClient({
  apiKey: 'server_806bdc9bb370dad11ec5807e82e57fa0',
  network: 'mainnet.eth.dfuse.io'
});

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
    },
    number
  ]
) {
  const [space, network, provider, addresses, options, snapshot] = args;
  const { coeff = 1, receivingAddresses, contractAddress, decimals } = options;

  type TokenTxLog = {
    from: string;
    to: string;
    amount: string;
  };
  const txLogs: TokenTxLog[] = await new Promise(async (resolve, reject) => {
    const txs: TokenTxLog[] = [];
    client.graphql(
      /* GraphQL */ `
        subscription(
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
            cursor
            node {
              matchingLogs {
                topics
                data
              }
            }
          }
        }
      `,
      (message, stream) => {
        if (message.type === 'error') {
          console.log('An error occurred', message.errors, message.terminal);
        }

        if (message.type === 'data') {
          const {
            cursor,
            node: { matchingLogs }
          } = message.data.searchTransactions;
          txs.push(
            ...matchingLogs.map((log) => {
              const [, from, to] = log.topics.map((t) =>
                t.replace('0x000000000000000000000000', '0x')
              );
              const amount = BigNumber.from(log.data);
              return {
                from,
                to,
                amount
              };
            })
          );
          stream.mark({ cursor });
        }

        if (message.type === 'complete') {
          resolve(txs);
        }
      },
      {
        variables: {
          query: `topic.0:'Transfer(address,address,uint256)' (${addresses
            .map((a) => `topic.1:'${a}'`)
            .join(' OR ')}) (${receivingAddresses
            .map((a) => `topic.2:'${a}'`)
            .join(' OR ')})`,
          sort: 'ASC',
          limit: 0,
          high: await provider.getBlockNumber()
        }
      }
    );
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
        parseFloat(
          formatUnits(BigNumber.from(curr.amount), BigNumber.from(decimals))
        ) *
          coeff
      );
    }, 0);
  }
  return scores;
}

export interface EtherScanLogResponse {
  status: string;
  message: string;
  result: EtherScanLogResult[];
}

export interface EtherScanLogResult {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  timeStamp: string;
  gasPrice: string;
  gasUsed: string;
  logIndex: string;
  transactionHash: string;
  transactionIndex: string;
}
