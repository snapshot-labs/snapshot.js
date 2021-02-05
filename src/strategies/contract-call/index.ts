import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'in19farkt';
export const version = '0.1.0';

function getArgs(options, address: string) {
  const args: Array<string | number> = options.args || ['%{address}'];
  return args.map((arg) =>
    typeof arg === 'string' ? arg.replace(/%{address}/g, address) : arg
  );
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
  const response = await multicall(
    network,
    provider,
    [options.methodABI],
    addresses.map((address: any) => [
      options.address,
      options.methodABI.name,
      getArgs(options, address)
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals))
    ])
  );
}
