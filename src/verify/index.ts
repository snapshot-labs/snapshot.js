import * as starknet from './starknet';
import * as evm from './evm';
import { isEvmAddress, isStarknetAddress } from '../utils';
import type { StarknetType } from 'starknet';
import type { TypedDataField } from '@ethersproject/abstract-signer';
import { STARKNET_NETWORK_IDS } from '../utils/provider';
import type { ProviderOptions, StarknetNetworkId } from '../utils/provider';

export type SignaturePayload = {
  domain: Record<string, string | number>;
  types: Record<string, StarknetType[] | TypedDataField[]>;
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

  if (starknet.isStarknetMessage(data)) {
    if (
      !(STARKNET_NETWORK_IDS as readonly (string | number)[]).includes(network)
    ) {
      throw new Error(`Invalid Starknet network: ${network}`);
    }

    return starknet.default(
      address,
      sig as string[],
      data,
      network as StarknetNetworkId,
      options
    );
  }

  return evm.default(address, sig as string, data, network, options);
}
