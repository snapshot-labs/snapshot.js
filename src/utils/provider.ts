import {
  JsonRpcBatchProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers';
import { RpcProvider } from 'starknet';
import networks from '../networks.json';

export interface ProviderOptions {
  readonly broviderUrl?: string;
  readonly timeout?: number;
}

type ProviderInstance =
  | JsonRpcBatchProvider
  | StaticJsonRpcProvider
  | RpcProvider;

type ProviderType = 'evm' | 'starknet' | 'evmBatched' | 'starknetBatched';

const DEFAULT_BROVIDER_URL = 'https://rpc.snapshot.org' as const;
const DEFAULT_TIMEOUT = 25000 as const;
const STARKNET_BROVIDER_KEYS: string[] = ['sn', 'sn-sep'] as const;

const providerMemo = new Map<string, ProviderInstance>();
const batchedProviderMemo = new Map<string, ProviderInstance>();

const providerFnMap: Record<
  ProviderType,
  (networkId: string, options: Required<ProviderOptions>) => ProviderInstance
> = {
  evm: getEvmProvider,
  starknet: getStarknetProvider,
  evmBatched: getEvmBatchedProvider,
  starknetBatched: getStarknetBatchedProvider
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
  return String(config.key);
}

function getProviderType(networkId: string, batched: boolean): ProviderType {
  const isStarknet = STARKNET_BROVIDER_KEYS.includes(networkId);
  return `${isStarknet ? 'starknet' : 'evm'}${
    batched ? 'Batched' : ''
  }` as ProviderType;
}

function createMemoKey(
  networkId: string,
  options: Required<ProviderOptions>
): string {
  return `${networkId}:${options.broviderUrl}:${options.timeout}`;
}

// return loose `any` type to avoid typecheck issues on package consumers
function getMemoizedProvider(
  memo: Map<string, ProviderInstance>,
  network: string | number,
  options: ProviderOptions = {},
  batched = false
): any {
  const networkId = getBroviderNetworkId(network);
  const normalizedOptions = normalizeOptions(options);
  const memoKey = createMemoKey(networkId, normalizedOptions);

  const memoized = memo.get(memoKey);
  if (memoized) {
    return memoized;
  }

  const providerType = getProviderType(networkId, batched);
  const provider = providerFnMap[providerType](networkId, normalizedOptions);

  memo.set(memoKey, provider);
  return provider;
}

export default function getProvider(
  network: string | number,
  options: ProviderOptions = {}
) {
  return getMemoizedProvider(providerMemo, network, options);
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

export function getBatchedProvider(
  network: string | number,
  options: ProviderOptions = {}
) {
  return getMemoizedProvider(batchedProviderMemo, network, options, true);
}

function getEvmBatchedProvider(
  networkId: string,
  options: Required<ProviderOptions>
): JsonRpcBatchProvider {
  return new JsonRpcBatchProvider({
    url: `${options.broviderUrl}/${networkId}`,
    timeout: options.timeout,
    allowGzip: true
  });
}

function getStarknetBatchedProvider(
  networkKey: string,
  options: Required<ProviderOptions>
): RpcProvider {
  return new RpcProvider({
    nodeUrl: `${options.broviderUrl}/${networkKey}`,
    batch: 0
  });
}
