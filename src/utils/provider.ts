import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { LibraryError, RpcProvider } from 'starknet';
import { withTimeout } from './fetch';
import networks from '../networks.json';

export interface ProviderOptions {
  readonly broviderUrl?: string;
  readonly timeout?: number;
}

type ProviderInstance = StaticJsonRpcProvider | RpcProvider;

export type ProviderType = 'evm' | 'starknet';

const DEFAULT_BROVIDER_URL = 'https://rpc.snapshot.org' as const;
export const DEFAULT_TIMEOUT = 25000 as const;

const providerMemo = new Map<string, ProviderInstance>();

const providerFnMap: Record<
  ProviderType,
  (networkId: string, options: Required<ProviderOptions>) => ProviderInstance
> = {
  evm: getEvmProvider,
  starknet: getStarknetProvider
};

export function normalizeOptions(
  options: ProviderOptions = {}
): Required<ProviderOptions> {
  const { timeout } = options;

  return {
    broviderUrl: options.broviderUrl || DEFAULT_BROVIDER_URL,
    // Not `??`: it passes `NaN` through (`Number()` of an unset env var), and
    // `setTimeout(..., NaN)` fires on the next tick, aborting every request.
    timeout:
      typeof timeout === 'number' && Number.isFinite(timeout) && timeout >= 0
        ? // setTimeout's delay is a 32-bit signed int; above this Node
          // silently clamps it to ~1ms instead of the requested duration.
          Math.min(timeout, 2_147_483_647)
        : DEFAULT_TIMEOUT
  };
}

export function getBroviderNetworkId(network: string | number): string {
  const config = networks[network];
  if (!config) {
    throw new Error(`Network '${network}' is not supported`);
  }
  return config.broviderId || String(network);
}

export function getProviderType(network: string | number): ProviderType {
  return networks[network]?.starknet ? 'starknet' : 'evm';
}

export function createMemoKey(
  networkId: string,
  options: Required<ProviderOptions>
): string {
  return `${networkId}:${options.broviderUrl}:${options.timeout}`;
}

// return loose `any` type to avoid typecheck issues on package consumers
export default function getProvider(
  network: string | number,
  options: ProviderOptions = {}
): any {
  const networkId = getBroviderNetworkId(network);
  const normalizedOptions = normalizeOptions(options);
  const memoKey = createMemoKey(networkId, normalizedOptions);

  const memoized = providerMemo.get(memoKey);
  if (memoized) {
    return memoized;
  }

  const providerType = getProviderType(network);
  const provider = providerFnMap[providerType](networkId, normalizedOptions);

  providerMemo.set(memoKey, provider);
  return provider;
}

function getEvmProvider(
  networkId: string,
  options: Required<ProviderOptions>
): StaticJsonRpcProvider {
  return new StaticJsonRpcProvider(
    {
      url: `${options.broviderUrl}/${networkId}`,
      timeout: options.timeout,
      allowGzip: true
    },
    Number(networkId)
  );
}

// LibraryError specifically: RpcChannel#errorHandler re-throws anything else
// as a bare `Error(message)`, which would drop `code`. Nothing outside this
// call site needs it, so it stays out of the primitive.
const starknetTimeoutError = (timeout: number) =>
  Object.assign(new LibraryError(`Request timeout after ${timeout}ms`), {
    code: 'TIMEOUT'
  });

function getStarknetProvider(
  networkKey: string,
  options: Required<ProviderOptions>
): RpcProvider {
  return new RpcProvider({
    nodeUrl: `${options.broviderUrl}/${networkKey}`,
    // At 0 there is no deadline to add, so leave starknet its own transport
    // (`baseFetch ?? ponyfill`) rather than swap the transport for nothing.
    // Native `fetch`, bound like starknet's own browser default: the package
    // floor has it everywhere (Node >= 18, evergreen browsers), and
    // cross-fetch would downgrade it — node-fetch 2 on Node (losing
    // connection reuse), an XHR ponyfill in the bundled browser build.
    baseFetch:
      options.timeout > 0
        ? withTimeout(fetch.bind(globalThis), options.timeout, {
            timeoutError: starknetTimeoutError
          })
        : undefined
  });
}
