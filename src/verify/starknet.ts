import { Contract, RpcProvider, typedData } from 'starknet';
import type { SignaturePayload } from '.';
import type { ProviderOptions } from '../utils/provider';

export type NetworkType = 'SN_MAIN' | 'SN_SEPOLIA';

const RPC_URLS: Record<NetworkType, string> = {
  SN_MAIN: 'https://starknet-mainnet.public.blastapi.io',
  SN_SEPOLIA: 'https://starknet-sepolia.public.blastapi.io'
};

const ABI = [
  {
    name: 'argent::account::interface::IDeprecatedArgentAccount',
    type: 'interface',
    items: [
      {
        name: 'isValidSignature',
        type: 'function',
        inputs: [
          {
            name: 'hash',
            type: 'core::felt252'
          },
          {
            name: 'signatures',
            type: 'core::array::Array::<core::felt252>'
          }
        ],
        outputs: [
          {
            type: 'core::felt252'
          }
        ],
        state_mutability: 'view'
      }
    ]
  }
];

function getProvider(network: NetworkType, options: ProviderOptions) {
  if (!RPC_URLS[network]) throw new Error('Invalid network');

  return new RpcProvider({
    nodeUrl: options?.broviderUrl ?? RPC_URLS[network]
  });
}

export function isStarknetMessage(data: SignaturePayload): boolean {
  return !!data.primaryType && !!data.types.StarkNetDomain;
}

export function getHash(data: SignaturePayload, address: string): string {
  const { domain, types, primaryType, message } =
    data as Required<SignaturePayload>;

  return typedData.getMessageHash(
    { types, primaryType, domain, message },
    address
  );
}

export default async function verify(
  address: string,
  sig: string[],
  data: SignaturePayload,
  network: NetworkType = 'SN_MAIN',
  options: ProviderOptions = {}
): Promise<boolean> {
  const contractAccount = new Contract(
    ABI,
    address,
    getProvider(network, options)
  );

  await contractAccount.isValidSignature(getHash(data, address), [
    sig[0],
    sig[1]
  ]);

  return true;
}
