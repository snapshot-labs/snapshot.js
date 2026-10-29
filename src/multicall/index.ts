import multicallEvm from './evm';
import multicallStarknet from './starknet';
import Multicaller from './multicaller';
import networks from '../networks.json';

// Canonical Multicall3, used for chains missing from networks.json
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

const MULTICALLS_FN = {
  evm: multicallEvm,
  starknet: multicallStarknet
} as const;

const getMulticallAddress = (network: string | number): string =>
  networks[network]?.multicall || MULTICALL3_ADDRESS;

async function multicall(
  network: string,
  provider,
  abi: any[],
  calls: any[],
  options: Record<string, any> = {}
) {
  const address = options?.multicallAddress || getMulticallAddress(network);

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

export { multicall, Multicaller, getMulticallAddress };
