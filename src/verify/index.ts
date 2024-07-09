import { isEvmAddress } from '../utils';
import verifyStarknetMessage, {
  type NetworkType,
  getHash as getStarknetHash,
  isStarknetMessage
} from './starknet';
import verifyEvmMessage, { getHash as getEvmHash } from './evm';
import type { ProviderOptions } from '../utils/provider';
import type { StarkNetType } from 'starknet';
import type { TypedDataField } from '@ethersproject/abstract-signer';

export type SignaturePayload = {
  domain: Record<string, string>;
  types: Record<string, StarkNetType[] | TypedDataField[]>;
  primaryType?: string;
  message: Record<string, any>;
};

export function getHash(data: SignaturePayload, address?: string): string {
  if (isStarknetMessage(data)) return getStarknetHash(data, address as string);

  return getEvmHash(data);
}

export async function verify(
  address: string,
  sig: string | string[],
  data: SignaturePayload,
  network = '1',
  options: ProviderOptions = {}
): Promise<boolean> {
  if (isStarknetMessage(data)) {
    return await verifyStarknetMessage(
      address,
      sig as string[],
      data,
      network as NetworkType,
      options
    );
  } else if (isEvmAddress(address)) {
    return await verifyEvmMessage(
      address,
      sig as string,
      data,
      network,
      options
    );
  } else {
    throw new Error('Invalid payload');
  }
}
