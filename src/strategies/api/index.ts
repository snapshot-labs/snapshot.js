import fetch from 'cross-fetch';
import { formatUnits } from '@ethersproject/units';

export const author = 'ganzai-san';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const api_url =
    options.api + '/' + options.strategy + '?addresses=' + addresses.join(',');
  const response = await fetch(api_url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return Object.fromEntries(
    //    data.score.map((value) => [value.address, parseInt(value.score.toString())])
    data.score.map((value) => [
      value.address,
      parseFloat(formatUnits(value.score.toString(), options.decimals))
    ])
  );
}
