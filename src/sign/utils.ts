import { verifyTypedData } from '@ethersproject/wallet';
import { _TypedDataEncoder } from '@ethersproject/hash';
import { verify as verifyEIP1271 } from './eip1271';
import { isAddress } from '@ethersproject/address';
import { ProviderOptions } from '../utils/provider';
import { isStarknetAddress } from '../utils';

type SignaturePayload = {
  domain: any;
  types: any;
  message: any;
};

export function getHash(data: SignaturePayload): string {
  const { domain, types, message } = data;
  return _TypedDataEncoder.hash(domain, types, message);
}

export async function verify(
  address: string,
  sig: string,
  data: SignaturePayload,
  network = '1',
  options: ProviderOptions = {}
) {
  if (isAddress(address)) {
    return await verifyEvmMessage(address, sig, data, network, options);
  } else if (isStarknetAddress(address)) {
    return await verifyStarknetMessage(address, sig, data, network, options);
  } else {
    throw new Error('Invalid address');
  }
}

async function verifyEvmMessage(
  address: string,
  sig: string,
  data: SignaturePayload,
  network: string,
  options: ProviderOptions
) {
  const { domain, types, message } = data;

  try {
    const recoverAddress = verifyTypedData(domain, types, message, sig);
    if (address === recoverAddress) return true;
  } catch (e) {}

  return await verifyEIP1271(address, sig, getHash(data), network, options);
}

async function verifyStarknetMessage(
  address: string,
  sig: string,
  data: SignaturePayload,
  network: string,
  options: ProviderOptions
) {
  const { domain, types, message } = data;

  const recoverAddress = verifyTypedData(domain, types, message, sig);

  return address === recoverAddress;
}
