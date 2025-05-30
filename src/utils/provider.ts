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
  network: string | number,
  options: ProviderOptions = {}
) {
  const stringNetwork = String(network);

  if (providers[stringNetwork]) {
    return providers[stringNetwork];
  }

  if (Object.keys(STARKNET_NETWORKS).includes(stringNetwork)) {
    providers[stringNetwork] = getStarknetProvider(stringNetwork, options);
  } else {
    providers[stringNetwork] = getEvmProvider(stringNetwork, options);
  }

  return providers[stringNetwork];
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
  network: string | number,
  options: ProviderOptions = {}
) {
  const stringNetwork = String(network);

  if (batchedProviders[stringNetwork]) {
    return batchedProviders[stringNetwork];
  }

  if (Object.keys(STARKNET_NETWORKS).includes(stringNetwork)) {
    batchedProviders[stringNetwork] = getStarknetBatchedProvider(
      stringNetwork,
      options
    );
  } else {
    batchedProviders[stringNetwork] = getEvmBatchedProvider(
      stringNetwork,
      options
    );
  }

  return batchedProviders[stringNetwork];
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
