import {
  JsonRpcBatchProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers';
import { constants, RpcProvider } from 'starknet';

const providers = {};
const batchedProviders = {};

export type ProviderOptions = {
  broviderUrl?: string;
  timeout?: number;
};

const DEFAULT_BROVIDER_URL = 'https://rpc.snapshot.org';
const DEFAULT_TIMEOUT = 25000;
const STARKNET_NETWORKS = {
  '0x534e5f4d41494e': constants.NetworkName.SN_MAIN,
  '0x534e5f5345504f4c4941': constants.NetworkName.SN_SEPOLIA
};

export default function getProvider(
  network: string,
  options: ProviderOptions = {}
) {
  if (providers[network]) {
    return providers[network];
  }

  if (Object.keys(STARKNET_NETWORKS).includes(network)) {
    providers[network] = getStarknetProvider(network, options);
  } else {
    providers[network] = getEvmProvider(network, options);
  }

  return providers[network];
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
  { broviderUrl }: ProviderOptions = {}
) {
  return new RpcProvider({
    nodeUrl: broviderUrl || STARKNET_NETWORKS[network]
  });
}

export function getBatchedProvider(
  network: string,
  options: ProviderOptions = {}
) {
  if (batchedProviders[network]) {
    return batchedProviders[network];
  }

  if (Object.keys(STARKNET_NETWORKS).includes(network)) {
    batchedProviders[network] = getStarknetBatchedProvider(network, options);
  } else {
    batchedProviders[network] = getEvmBatchedProvider(network, options);
  }

  return batchedProviders[network];
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
  { broviderUrl }: ProviderOptions = {}
) {
  return new RpcProvider({
    nodeUrl: broviderUrl || STARKNET_NETWORKS[network],
    batch: 0
  });
}
