import { constants } from 'starknet';
import multicallEvm from './evm';
import multicallStarknet from './starknet';
import networks from '../networks.json';

const STARKNET_CHAIN_IDS = [
  constants.StarknetChainId.SN_MAIN,
  constants.StarknetChainId.SN_SEPOLIA
];

const MULTICALLS_FN = {
  evm: multicallEvm,
  starknet: multicallStarknet
};

export default async function multicall(
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

  const protocol = STARKNET_CHAIN_IDS.includes(network as any)
    ? 'starknet'
    : 'evm';

  return MULTICALLS_FN[protocol](
    address,
    provider,
    abi,
    calls,
    limit,
    multicallOptions
  );
}
