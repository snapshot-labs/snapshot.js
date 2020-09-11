import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { abi } from './TestToken.json';

export async function strategy(provider, addresses, options, snapshot) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    provider,
    abi,
    addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
    { blockTag }
  );

  var total = 0;

  var data = Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals))
    ])
  );

   //Total for %
  for (let value of response.values()) {
      total+=value;                 //37 35 40
  }

  var r = 50; //factor
  
  data = Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      r * value/total
    ])
  );



  return data;
}
