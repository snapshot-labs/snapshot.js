import fetch from 'cross-fetch';
import { strategy as erc20BalanceStrategy } from '../erc20-balance-of';

interface ApiReturn {
  balance: string[];
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
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  if (blockTag == 'latest')
    return erc20BalanceStrategy(
      space,
      network,
      provider,
      addresses,
      options,
      snapshot
    );

  const apiUrl = getUrl(network);
  const response = await fetch(
    `${apiUrl}/api.AccountService.GetErc20TokenBalanceByHeight`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: addresses,
        height: snapshot,
        contract_address: options.address
      })
    }
  );

  const ret: ApiReturn = await response.json();
  return Object.fromEntries(
    ret.balance.map((v, i) => [addresses[i], parseFloat(v)])
  );
}
