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

// starknet.js v6 has no timeout option, and its RpcChannel calls `baseFetch`
// with no signal of its own, so bounding the fetch is the only way to bound a
// request. Without this a node that accepts the connection but never answers
// hangs until the runtime's own ceiling (~300s on undici), and a hang is not
// contained by a caller's try/catch the way a throw is.
//
// AbortController + setTimeout rather than `AbortSignal.timeout`, which needs
// Safari 16 / Firefox 100: this is what the `fetch` helper in ../utils already
// does, so the browser bundle keeps the floor it has today. That helper cannot
// be reused here, ../utils imports this module.
export function withTimeout(baseFetch: BaseFetch, timeout: number): BaseFetch {
  if (timeout <= 0) return baseFetch;

  return async (url, init) => {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);

    // Compose with a caller's signal rather than replacing it, so an abort from
    // above still cancels the request at once and arrives with its own reason
    // instead of being held until the timeout. An engine that predates
    // `abort(reason)` ignores the argument and still aborts.
    const callerSignal = init?.signal;
    const abortFromCaller = () => controller.abort(callerSignal?.reason);
    if (callerSignal?.aborted) abortFromCaller();
    else callerSignal?.addEventListener('abort', abortFromCaller);

    try {
      return await baseFetch(url, { ...init, signal: controller.signal });
    } catch (e) {
      if (!timedOut) throw e;

      // RpcChannel#errorHandler re-throws anything that is not a LibraryError
      // as a bare `Error(message)`, which drops own properties, so `code` only
      // survives on a LibraryError. `TIMEOUT` is the code ethers puts on the
      // EVM provider's timeout, so both providers now fail the same way.
      throw Object.assign(
        new LibraryError(`Request timeout after ${timeout}ms`),
        {
          code: 'TIMEOUT'
        }
      );
    } finally {
      clearTimeout(timer);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    }
  };
}

function getStarknetProvider(
  networkKey: string,
  options: Required<ProviderOptions>
): RpcProvider {
  return new RpcProvider({
    nodeUrl: `${options.broviderUrl}/${networkKey}`,
    baseFetch: withTimeout(crossFetch, options.timeout)
  });
}
