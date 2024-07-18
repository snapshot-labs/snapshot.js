import * as starknet from './starknet';
import * as evm from './evm';
import { isEvmAddress, isStarknetAddress } from '../utils';
import type { StarkNetType } from 'starknet';
import type { TypedDataField } from '@ethersproject/abstract-signer';
import type { ProviderOptions } from '../utils/provider';

export type SignaturePayload = {
  domain: Record<string, string | number>;
  types: Record<string, StarkNetType[] | TypedDataField[]>;
  primaryType?: string;
  message: Record<string, any>;
};

export function getHash(data: SignaturePayload, address?: string): string {
  const networkType = starknet.isStarknetMessage(data) ? starknet : evm;

  return networkType.getHash(data, address as string);
}

export async function verify(
  address: string,
  sig: string | string[],
  data: SignaturePayload,
  network = '1',
  options: ProviderOptions = {}
): Promise<boolean> {
  if (!isStarknetAddress(address) && !isEvmAddress(address)) {
    throw new Error('Invalid address');
  }

  const networkType = starknet.isStarknetMessage(data) ? starknet : evm;

  return await networkType.default(
    address,
    sig as any,
    data,
    network as any,
    options
  );
}
