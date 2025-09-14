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

/**
 * Processes a StarkNet signature array and returns the appropriate signature format
 * for contract verification.
 * Returns the r ands values for each signature in the array.
 *
 * Handles the following cases:
 * - 2-item array: Standard signature, returns as-is.
 * - 3-item array: Some wallets (e.g., Braavos) may return a 3-item array; returns the last two items.
 * - Multi-signer array: For multisig accounts, the array may contain multiple signatures;
 *   this function extracts the relevant signature pairs.
 *
 * @param {string[]} sig - The signature array to process. Must have at least 2 items.
 * @returns {string[]} The processed signature array suitable for contract verification.
 * @throws {Error} If the signature array has fewer than 2 items.
 */
function getSignatureArray(sig: string[]): string[] {
  if (sig.length < 2) {
    throw new Error('Invalid signature format');
  }

  if (sig.length <= 3) {
    return sig.slice(-2);
  }

  const results: string[] = [];
  for (let i = 1; i < sig.length; i += 4) {
    results.push(sig[i + 2], sig[i + 3]);
  }

  return results;
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

    const result = await contractAccount.is_valid_signature(
      getHash(data, address),
      getSignatureArray(sig)
    );

    return BigNumber.from(result).eq(BigNumber.from('370462705988'));
  } catch (e: any) {
    if (e.message.includes('Contract not found')) {
      throw new Error('Contract not deployed');
    }

    throw e;
  }
}
