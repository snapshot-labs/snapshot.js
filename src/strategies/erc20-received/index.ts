import fetch from 'cross-fetch';
import { Web3Provider } from '@ethersproject/providers';
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

  const etherscanApiKey = 'TRBDWD7I5UK25G1ZZAZ3I889S6F4KBP4BN';
  const logResults: {
    fromAddress: string;
    toAddress: string;
    amount: number;
  }[] = [];
  const requestDelay = 1000 / 5;
  let iteration = 0;
  let lastFetchTime = Date.now();

  for (let fromAddress of addresses)
    for (let toAddress of receivingAddresses) {
      await new Promise((r) =>
        setTimeout(r, requestDelay - Math.max(0, Date.now() - lastFetchTime))
      );
      const r = await fetch(
        `https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${contractAddress}&topic1=${fromAddress.replace(
          '0x',
          '0x000000000000000000000000'
        )}&topic1_2_opr=and&topic2=${toAddress.replace(
          '0x',
          '0x000000000000000000000000'
        )}&apikey=${etherscanApiKey}`
      ).then<EtherScanLogResponse>((r) => r.json());
      if (typeof r.result == 'string')
        throw new Error(r.message + ' - ' + r.result);
      logResults.push(
        ...r.result.map((eventLog) => ({
          fromAddress,
          toAddress,
          amount: parseFloat(
            formatUnits(BigNumber.from(eventLog.data), BigNumber.from(decimals))
          )
        }))
      );
    }

  const scores = {};
  for (const address of addresses) {
    scores[address] = logResults
      .filter((eventLog) => {
        const validAddress =
          eventLog.fromAddress.toLowerCase() == address.toLowerCase();
        return validAddress;
      })
      .reduce((prev, curr) => {
        return prev + curr.amount * coeff;
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
