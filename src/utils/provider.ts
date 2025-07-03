import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { RpcProvider } from 'starknet';
import networks from '../networks.json';

export interface ProviderOptions {
  readonly broviderUrl?: string;
  readonly timeout?: number;
}

type ProviderInstance = StaticJsonRpcProvider | RpcProvider;

type ProviderType = 'evm' | 'starknet';

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

function normalizeOptions(
  options: ProviderOptions = {}
): Required<ProviderOptions> {
  return {
    broviderUrl: options.broviderUrl || DEFAULT_BROVIDER_URL,
    timeout: options.timeout ?? DEFAULT_TIMEOUT
  };
}

function getBroviderNetworkId(network: string | number): string {
  const config = networks[network];
  if (!config) {
    throw new Error(`Network '${network}' is not supported`);
  }
  return config.broviderId || String(network);
}

function getProviderType(network: string | number): ProviderType {
  return networks[network]?.starknet ? 'starknet' : 'evm';
}

function createMemoKey(
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

function getStarknetProvider(
  networkKey: string,
  options: Required<ProviderOptions>
): RpcProvider {
  return new RpcProvider({
    nodeUrl: `${options.broviderUrl}/${networkKey}`
  });
}
