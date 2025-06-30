import { Contract, RpcProvider, typedData, constants } from 'starknet';
import { BigNumber } from '@ethersproject/bignumber';
import networks from '../networks.json';
import type { SignaturePayload } from '.';
import type { ProviderOptions } from '../utils/provider';

export type NetworkType = 'SN_MAIN' | 'SN_SEPOLIA';

const RPC_URLS: Record<NetworkType, string> = {
  SN_MAIN: networks[constants.StarknetChainId.SN_MAIN]?.rpc?.[0],
  SN_SEPOLIA: networks[constants.StarknetChainId.SN_SEPOLIA]?.rpc?.[0]
};

const ABI = [
  {
    name: 'argent::common::account::IAccount',
    type: 'interface',
    items: [
      {
        name: 'is_valid_signature',
        type: 'function',
        inputs: [
          {
            name: 'hash',
            type: 'core::felt252'
          },
          {
            name: 'signature',
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
  try {
    const contractAccount = new Contract(
      ABI,
      address,
      getProvider(network, options)
    );

    if (sig.length < 2) {
      throw new Error('Invalid signature format');
    }

    const result = await contractAccount.is_valid_signature(
      getHash(data, address),
      sig.slice(-2)
    );

    return BigNumber.from(result).eq(BigNumber.from('370462705988'));
  } catch (e: any) {
    if (e.message.includes('Contract not found')) {
      throw new Error('Contract not deployed');
    }

    throw e;
  }
}
