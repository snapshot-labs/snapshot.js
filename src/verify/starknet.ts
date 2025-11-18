import { typedData, TypedData } from 'starknet';
import type { ProviderOptions } from '../utils/provider';
import type { SignaturePayload } from '.';
import getProvider from '../utils/provider';

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
  network = '0x534e5f4d41494e',
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
