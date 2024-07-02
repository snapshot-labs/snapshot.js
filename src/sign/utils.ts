import { verifyTypedData } from '@ethersproject/wallet';
import { _TypedDataEncoder } from '@ethersproject/hash';
import { Contract, RpcProvider, typedData } from 'starknet';
import { isAddress } from '@ethersproject/address';
import { verify as verifyEIP1271 } from './eip1271';
import { ProviderOptions } from '../utils/provider';
import { isStarknetAddress } from '../utils';
import snAccountAbi from './starknet-account-abi.json';

type SignaturePayload = {
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
  network = '1',
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
      network,
      options
    );
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
): Promise<boolean> {
  const { domain, types, message } = data;

  try {
    const recoverAddress = verifyTypedData(domain, types, message, sig);
    if (address === recoverAddress) return true;
  } catch (e: any) {}

  return await verifyEIP1271(address, sig, getHash(data), network, options);
}

async function verifyStarknetMessage(
  address: string,
  sig: string[],
  data: SignaturePayload,
  network: string,
  options: ProviderOptions
): Promise<boolean> {
  const { domain, types, primaryType, message } =
    data as Required<SignaturePayload>;
  const provider = new RpcProvider({
    nodeUrl:
      options?.broviderUrl ??
      'https://starknet-mainnet.infura.io/v3/46a5dd9727bf48d4a132672d3f376146'
  });
  const contractAccount = new Contract(snAccountAbi, address, provider);

  const hash = typedData.getMessageHash(
    { types, primaryType, domain, message },
    address
  );

  await contractAccount.isValidSignature(hash, sig);

  return true;
}
