import { createPublicClient, http, PublicClient } from 'viem';
import {
  ProviderOptions,
  createMemoKey,
  getBroviderNetworkId,
  getProviderType,
  normalizeOptions
} from './provider';

// Kept out of ./provider on purpose: that module is loaded from the package
// entry point, and a top-level viem import there would make every consumer
// eagerly initialize viem (see the dist entry assertions in
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
