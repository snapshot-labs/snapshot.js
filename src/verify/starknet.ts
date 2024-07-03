import { Contract, RpcProvider, typedData } from 'starknet';
import abi from './starknet-account-abi.json';
import type { SignaturePayload } from '.';
import type { ProviderOptions } from '../utils/provider';

export default async function verify(
  address: string,
  sig: string[],
  data: SignaturePayload,
  options: ProviderOptions = {}
): Promise<boolean> {
  const { domain, types, primaryType, message } =
    data as Required<SignaturePayload>;
  const provider = new RpcProvider({
    nodeUrl:
      options?.broviderUrl ?? 'https://starknet-mainnet.public.blastapi.io'
  });
  const contractAccount = new Contract(abi, address, provider);

  const hash = typedData.getMessageHash(
    { types, primaryType, domain, message },
    address
  );

  await contractAccount.isValidSignature(hash, sig);

  return true;
}
