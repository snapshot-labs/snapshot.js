import { shortString, typedData, TypedData } from 'starknet';
import type { ProviderOptions, StarknetNetworkId } from '../utils/provider';
import type { SignaturePayload } from '.';
import getProvider from '../utils/provider';

// starknet.js matches these revert reasons as text, but RPC 0.9 returns them
// as a raw felt. `argent/invalid-signature` encodes to a prefix of the felt
// for `argent/invalid-signature-format`, covering both Argent reasons.
const INVALID_SIGNATURE_REVERTS = [
  'argent/invalid-signature',
  'INVALID_SIG'
].map((reason) => shortString.encodeShortString(reason));

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
  network: StarknetNetworkId = '0x534e5f4d41494e',
  options: ProviderOptions = {}
): Promise<boolean> {
  try {
    const provider = getProvider(network, options);

    // Check if the contract is deployed
    // Will throw on non-deployed contract
    await provider.getClassAt(address);

    // Awaited, not returned: a returned promise rejects outside this try
    return await provider.verifyMessageInStarknet(
      data as TypedData,
      sig,
      address
    );
  } catch (e: any) {
    if (e.message.includes('Contract not found')) {
      throw new Error('Contract not deployed');
    }

    // Only the segment after the request dump: starknet.js prefixes the RPC
    // error with the calldata it sent, so a caller-supplied signature felt
    // would otherwise match these markers on any node error.
    const [, ...rpcError] = e.message.split('\n\n');
    const message = rpcError.join('\n\n').toLowerCase();
    if (INVALID_SIGNATURE_REVERTS.some((felt) => message.includes(felt))) {
      return false;
    }

    throw e;
  }
}
