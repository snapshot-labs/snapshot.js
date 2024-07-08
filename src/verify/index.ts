import utils from '../utils';
import verifyStarknetMessage, {
  type NetworkType,
  getHash as getStarknetHash
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
  if (data.primaryType && address) {
    return getStarknetHash(data, address);
  }

  return getEvmHash(data);
}

export async function verify(
  address: string,
  sig: string | string[],
  data: SignaturePayload,
  network = '1',
  options: ProviderOptions = {}
): Promise<boolean> {
  if (utils.isEvmAddress(address)) {
    return await verifyEvmMessage(
      address,
      sig as string,
      data,
      network,
      options
    );
  } else if (utils.isStarknetAddress(address)) {
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
