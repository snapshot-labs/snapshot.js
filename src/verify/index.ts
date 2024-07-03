import { _TypedDataEncoder } from '@ethersproject/hash';
import { isAddress } from '@ethersproject/address';
import { isStarknetAddress } from '../utils';
import verifyStarknetMessage, { type NetworkType } from './starknet';
import verifyEvmMessage from './evm';
import type { ProviderOptions } from '../utils/provider';

export type SignaturePayload = {
  domain: any;
  types: any;
  primaryType?: string;
  message: any;
};

export function getHash(data: SignaturePayload): string {
  const { domain, types, message } = data;
  return _TypedDataEncoder.hash(domain, types, message);
}

export async function verify(
  address: string,
  sig: string | string[],
  data: SignaturePayload,
  network: string | NetworkType = '1',
  options: ProviderOptions = {}
): Promise<boolean> {
  if (isAddress(address)) {
    return await verifyEvmMessage(
      address,
      sig as string,
      data,
      network,
      options
    );
  } else if (isStarknetAddress(address)) {
    return await verifyStarknetMessage(
      address,
      sig as string[],
      data,
      network as NetworkType,
      options
    );
  } else {
    throw new Error('Invalid address');
  }
}
