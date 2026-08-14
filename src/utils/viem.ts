import { ccipRequest, createPublicClient, http, PublicClient } from 'viem';
import type { CcipRequestParameters } from 'viem';
import {
  ProviderOptions,
  createMemoKey,
  getBroviderNetworkId,
  getProviderType,
  normalizeOptions
} from './provider';

const viemClientMemo = new Map<string, PublicClient>();

// The transport timeout only covers the JSON-RPC leg; CCIP-Read gateway
// requests use their own fetch, which would otherwise run unbounded
function ccipReadWithDeadline(timeout: number) {
  return {
    request: (parameters: CcipRequestParameters) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      if (typeof timer === 'object' && 'unref' in timer) timer.unref();
      return ccipRequest({
        ...parameters,
        requestOptions: { signal: controller.signal }
      }).finally(() => clearTimeout(timer));
    }
  };
}

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
    ccipRead:
      normalizedOptions.timeout > 0
        ? ccipReadWithDeadline(normalizedOptions.timeout)
        : undefined,
    transport: http(`${normalizedOptions.broviderUrl}/${networkId}`, {
      // single attempt within the timeout, like the ethers provider
      retryCount: 0,
      timeout: normalizedOptions.timeout
    })
  });

  viemClientMemo.set(memoKey, client);
  return client;
}
