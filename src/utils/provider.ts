import { StaticJsonRpcProvider } from '@ethersproject/providers';
import crossFetch from 'cross-fetch';
import { LibraryError, RpcProvider, RpcProviderOptions } from 'starknet';
import networks from '../networks.json';

export interface ProviderOptions {
  readonly broviderUrl?: string;
  readonly timeout?: number;
}

type ProviderInstance = StaticJsonRpcProvider | RpcProvider;

export type ProviderType = 'evm' | 'starknet';

const DEFAULT_BROVIDER_URL = 'https://rpc.snapshot.org' as const;
const DEFAULT_TIMEOUT = 25000 as const;

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
  return {
    broviderUrl: options.broviderUrl || DEFAULT_BROVIDER_URL,
    timeout: options.timeout ?? DEFAULT_TIMEOUT
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
  // Without this, `setTimeout(..., 0)` aborts every request on the next tick.
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

    // Resolving only means the headers arrived: RpcChannel reads the body
    // afterwards with its own `.json()`, and node-fetch bounds neither the
    // body stream nor the parse. Hold the deadline until that settles.
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
    // `undefined` leaves starknet its own transport (`baseFetch ?? ponyfill`):
    // with no timeout to add, swapping in crossFetch would only cost the
    // caller a transport and the ceiling that comes with the stock one.
    baseFetch:
      options.timeout > 0 ? withTimeout(crossFetch, options.timeout) : undefined
  });
}
