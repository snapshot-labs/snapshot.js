import { Contract, RpcProvider, typedData } from 'starknet';
import abi from './starknet-account-abi.json';
import type { SignaturePayload } from '.';
import type { ProviderOptions } from '../utils/provider';

type NetworkType = 'SN_MAIN' | 'SN_SEPOLIA';

const RPC_URLS: Record<NetworkType, string> = {
  SN_MAIN: 'https://starknet-mainnet.public.blastapi.io',
  SN_SEPOLIA: 'https://starknet-sepolia.public.blastapi.io'
};

function getProvider(network: NetworkType, options: ProviderOptions) {
  if (!RPC_URLS[network]) throw new Error('Invalid network type');

  return new RpcProvider({
    nodeUrl: options?.broviderUrl ?? RPC_URLS[network]
  });
}

export default async function verify(
  address: string,
  sig: string[],
  data: SignaturePayload,
  network: NetworkType = 'SN_MAIN',
  options: ProviderOptions = {}
): Promise<boolean> {
  const { domain, types, primaryType, message } =
    data as Required<SignaturePayload>;
  const contractAccount = new Contract(
    abi,
    address,
    getProvider(network, options)
  );
  const hash = typedData.getMessageHash(
    { types, primaryType, domain, message },
    address
  );

  await contractAccount.isValidSignature(hash, [sig[0], sig[1]]);

  return true;
}
