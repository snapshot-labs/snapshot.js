import { RpcProvider, typedData, constants, TypedData } from 'starknet';
import networks from '../networks.json';
import type { ProviderOptions } from '../utils/provider';
import type { SignaturePayload } from '.';

export type NetworkType = 'SN_MAIN' | 'SN_SEPOLIA';

const RPC_URLS: Record<NetworkType, string> = {
  SN_MAIN: networks[constants.StarknetChainId.SN_MAIN]?.rpc?.[0],
  SN_SEPOLIA: networks[constants.StarknetChainId.SN_SEPOLIA]?.rpc?.[0]
};

function getProvider(network: NetworkType, options: ProviderOptions) {
  if (!RPC_URLS[network]) throw new Error('Invalid network');

  return new RpcProvider({
    nodeUrl: options?.broviderUrl ?? RPC_URLS[network]
  });
}

export function isStarknetMessage(data: SignaturePayload): boolean {
  return !!data.primaryType && !!data.types.StarkNetDomain;
}

export function getHash(data: SignaturePayload, address: string): string {
  const { domain, types, primaryType, message } =
    data as Required<SignaturePayload>;

  return typedData.getMessageHash(
    { types, primaryType, domain, message },
    address
  );
}

export default async function verify(
  address: string,
  sig: string[],
  data: SignaturePayload,
  network: NetworkType = 'SN_MAIN',
  options: ProviderOptions = {}
): Promise<boolean> {
  try {
    const provider = getProvider(network, options);

    // Check if the contract is deployed
    // Will throw on non-deployed contract
    await provider.getClassAt(address);

    return provider.verifyMessageInStarknet(data as TypedData, sig, address);
  } catch (e: any) {
    if (e.message.includes('Contract not found')) {
      throw new Error('Contract not deployed');
    }

    throw e;
  }
}
