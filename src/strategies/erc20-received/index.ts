import fetch from 'cross-fetch';
import { InfuraProvider, Web3Provider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';

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

  const logResults = await new InfuraProvider().getLogs({
    address: contractAddress,
    fromBlock: 0,
    toBlock: 'latest',
    topics: [
      // transfer
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      // from
      addresses.map((a) => a.replace('0x', '0x000000000000000000000000')),
      // to
      receivingAddresses.map((a) =>
        a.replace('0x', '0x000000000000000000000000')
      )
    ]
  });
  const scores = {};
  for (const address of addresses) {
    const logsWithAddress = logResults.filter(
      ({ topics: [, fromHex, toHex] }) => {
        const validAddress =
          fromHex.replace('0x000000000000000000000000', '0x').toLowerCase() ==
          address.toLowerCase();
        return validAddress;
      }
    );
    // Sum of all transfers
    scores[address] = logsWithAddress.reduce((prev, curr) => {
      return (
        prev +
        parseFloat(
          formatUnits(BigNumber.from(curr.data), BigNumber.from(decimals))
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
