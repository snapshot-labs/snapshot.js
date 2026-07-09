import multicallEvm from './evm';
import multicallStarknet from './starknet';
import Multicaller from './multicaller';
import networks from '../networks.json';

const MULTICALLS_FN = {
  evm: multicallEvm,
  starknet: multicallStarknet
} as const;

async function multicall(
  network: string,
  provider,
  abi: any[],
  calls: any[],
  options: Record<string, any> = {}
) {
  const address = options?.multicallAddress || networks[network].multicall;

  if (!address) {
    throw new Error('missing multicall address');
  }

  const multicallOptions = { ...options };
  const limit = multicallOptions?.limit || 500;

  delete multicallOptions.limit;
  delete multicallOptions.multicallAddress;

  const protocol = networks[network]?.starknet ? 'starknet' : 'evm';

  return MULTICALLS_FN[protocol](
    address,
    provider,
    abi,
    calls,
    limit,
    multicallOptions
  );
}

export { multicall, Multicaller };
