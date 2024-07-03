import { Contract, RpcProvider, typedData } from 'starknet';
import abi from './starknet-account-abi.json';
import type { SignaturePayload } from '.';
import type { ProviderOptions } from '../utils/provider';

const DEFAULT_STARKNET_RPC = 'https://starknet-mainnet.public.blastapi.io';

function getProvider(options: ProviderOptions) {
  return new RpcProvider({
    nodeUrl: options?.broviderUrl ?? DEFAULT_STARKNET_RPC
  });
}

export default async function verify(
  address: string,
  sig: string[],
  data: SignaturePayload,
  options: ProviderOptions = {}
): Promise<boolean> {
  const { domain, types, primaryType, message } =
    data as Required<SignaturePayload>;
  const contractAccount = new Contract(abi, address, getProvider(options));
  const hash = typedData.getMessageHash(
    { types, primaryType, domain, message },
    address
  );

  await contractAccount.isValidSignature(hash, sig);

  return true;
}
