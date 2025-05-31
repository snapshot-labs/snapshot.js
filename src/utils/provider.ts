import {
  JsonRpcBatchProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers';
import { RpcProvider } from 'starknet';
import networks from '../networks.json';

const providers = {};
const batchedProviders = {};

export type ProviderOptions = {
  broviderUrl?: string;
  timeout?: number;
};

const DEFAULT_BROVIDER_URL = 'https://rpc.snapshot.org';
const DEFAULT_TIMEOUT = 25000;
const STARKNET_CHAIN_IDS = ['0x534e5f4d41494e', '0x534e5f5345504f4c4941'];

export default function getProvider(
  network: string | number,
  options: ProviderOptions = {}
) {
  const chainId = networks[network] ? String(networks[network].chainId) : null;

  if (!chainId) {
    throw new Error(`Network ${network} is not supported`);
  }

  if (providers[chainId]) {
    return providers[chainId];
  }

  if (STARKNET_CHAIN_IDS.includes(chainId)) {
    providers[chainId] = getStarknetProvider(chainId, options);
  } else {
    providers[chainId] = getEvmProvider(chainId, options);
  }

  return providers[chainId];
}

export function getEvmProvider(
  network: string,
  {
    broviderUrl = DEFAULT_BROVIDER_URL,
    timeout = DEFAULT_TIMEOUT
  }: ProviderOptions = {}
) {
  return new StaticJsonRpcProvider(
    {
      url: `${broviderUrl}/${network}`,
      timeout,
      allowGzip: true
    },
    Number(network)
  );
}

function getStarknetProvider(
  network: string,
  { broviderUrl = DEFAULT_BROVIDER_URL }: ProviderOptions = {}
) {
  return new RpcProvider({
    nodeUrl: `${broviderUrl}/${networks[network].key}`
  });
}

export function getBatchedProvider(
  network: string | number,
  options: ProviderOptions = {}
) {
  const chainId = networks[network] ? String(networks[network].chainId) : null;

  if (!chainId) {
    throw new Error(`Network ${network} is not supported`);
  }

  if (batchedProviders[chainId]) {
    return batchedProviders[chainId];
  }

  if (STARKNET_CHAIN_IDS.includes(chainId)) {
    batchedProviders[chainId] = getStarknetBatchedProvider(chainId, options);
  } else {
    batchedProviders[chainId] = getEvmBatchedProvider(chainId, options);
  }

  return batchedProviders[chainId];
}

function getEvmBatchedProvider(
  network: string,
  {
    broviderUrl = DEFAULT_BROVIDER_URL,
    timeout = DEFAULT_TIMEOUT
  }: ProviderOptions = {}
) {
  return new JsonRpcBatchProvider({
    url: `${broviderUrl}/${network}`,
    timeout,
    allowGzip: true
  });
}

function getStarknetBatchedProvider(
  network: string,
  { broviderUrl = DEFAULT_BROVIDER_URL }: ProviderOptions = {}
) {
  return new RpcProvider({
    nodeUrl: `${broviderUrl}/${networks[network].key}`,
    batch: 0
  });
}
