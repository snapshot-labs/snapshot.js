import { createPublicClient, http, PublicClient } from 'viem';
import {
  ProviderOptions,
  createMemoKey,
  getBroviderNetworkId,
  getProviderType,
  normalizeOptions
} from './provider';

// Kept out of ./provider so non-ENS consumers of getProvider never pull in
// viem; since ENS resolution routes through viem, the package entry points
// do import it eagerly (asserted in
// test/integration/utils/dist-entry.spec.ts)
const viemClientMemo = new Map<string, PublicClient>();

export function getViemClient(
  network: string | number,
  options: ProviderOptions = {}
): PublicClient {
  if (getProviderType(network) !== 'evm') {
    throw new Error(`Network '${network}' is not supported`);
  }

  const networkId = getBroviderNetworkId(network);
  const normalizedOptions = normalizeOptions(options);
  const memoKey = createMemoKey(networkId, normalizedOptions);

  const memoized = viemClientMemo.get(memoKey);
  if (memoized) {
    return memoized;
  }

  const client = createPublicClient({
    transport: http(`${normalizedOptions.broviderUrl}/${networkId}`, {
      timeout: normalizedOptions.timeout
    })
  });

  viemClientMemo.set(memoKey, client);
  return client;
}
