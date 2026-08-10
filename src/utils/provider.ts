import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { LibraryError, RpcProvider, RpcProviderOptions } from 'starknet';
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

type BaseFetch = NonNullable<RpcProviderOptions['baseFetch']>;

// Not `AbortSignal.timeout`: it would raise the browser bundle's floor to
// Safari 16.
export function withTimeout(baseFetch: BaseFetch, timeout: number): BaseFetch {
  // getStarknetProvider never calls in at 0, so this is the export's own
  // precondition rather than a live path: without it, `setTimeout(..., 0)`
  // would abort every request on the next tick.
  if (timeout <= 0) return baseFetch;

  return async (url, init) => {
    const controller = new AbortController();
    const callerSignal = init?.signal;
    const abortFromCaller = () => controller.abort(callerSignal?.reason);
    let timedOut = false;

    const cleanup = () => {
      clearTimeout(timer);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    };
    // Cleans up after itself: nothing else will if the body is never read.
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      cleanup();
    }, timeout);
    // Node-only: browser timers are numbers with no `unref`. Without this,
    // an unread response body holds the event loop open for the full
    // timeout even though the request already finished.
    if (typeof timer === 'object' && 'unref' in timer) timer.unref();

    // LibraryError specifically: RpcChannel#errorHandler re-throws anything
    // else as a bare `Error(message)`, which would drop `code`.
    const timeoutError = () =>
      Object.assign(new LibraryError(`Request timeout after ${timeout}ms`), {
        code: 'TIMEOUT'
      });

    if (callerSignal?.aborted) abortFromCaller();
    else callerSignal?.addEventListener('abort', abortFromCaller);

    let response: Response;
    try {
      response = await baseFetch(url, { ...init, signal: controller.signal });
    } catch (e) {
      cleanup();
      throw timedOut ? timeoutError() : e;
    }

    // Resolving only means the headers arrived; nothing bounds the body stream
    // or the parse that follow. Hold the deadline over RpcChannel's read.
    const json = response.json.bind(response);
    response.json = async () => {
      try {
        return await json();
      } catch (e) {
        throw timedOut ? timeoutError() : e;
      } finally {
        cleanup();
      }
    };

    return response;
  };
}

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
        ? withTimeout(fetch.bind(globalThis), options.timeout)
        : undefined
  });
}
