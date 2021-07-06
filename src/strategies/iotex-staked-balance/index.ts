import { strategy as EthBalanceStrategy } from '../eth-balance';
import fetch from 'cross-fetch';

interface ApiReturn {
  voteWeight: string[];
}

export const author = 'iotex';
export const version = '0.0.1';

const testNetUrl = 'https://testnet.iotexscout.io/apiproxy';
const mainNetUrl = 'https://iotexscout.io/apiproxy';

function getUrl(network) {
  return network == 4689 ? mainNetUrl : testNetUrl;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const height = typeof snapshot === 'number' ? snapshot : 10000000000;
  const apiUrl = getUrl(network);
  const response = await fetch(
    `${apiUrl}/api.AccountVoteService.GetVoteByHeight`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: addresses,
        height
      })
    }
  );

  const ret: ApiReturn = await response.json();
  return Object.fromEntries(
    ret.voteWeight.map((v, i) => [addresses[i], parseFloat(v)])
  );
}
