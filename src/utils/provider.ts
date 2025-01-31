import {
  JsonRpcBatchProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers';

const providers = {};
const batchedProviders = {};

export type ProviderOptions = {
  broviderUrl?: string;
  timeout?: number;
};

const DEFAULT_BROVIDER_URL = 'https://rpc.snapshot.org';
const DEFAULT_TIMEOUT = 25000;

export default function getProvider(
  network,
  {
    broviderUrl = DEFAULT_BROVIDER_URL,
    timeout = DEFAULT_TIMEOUT
  }: ProviderOptions = {}
) {
  const url = `${broviderUrl}/${network}`;
  if (!providers[network])
    providers[network] = new StaticJsonRpcProvider(
      {
        url,
        timeout,
        allowGzip: true
      },
      Number(network)
    );
  return providers[network];
}

export function getBatchedProvider(
  network,
  {
    broviderUrl = DEFAULT_BROVIDER_URL,
    timeout = DEFAULT_TIMEOUT
  }: ProviderOptions = {}
) {
  const url = `${broviderUrl}/${network}`;
  if (!batchedProviders[network])
    batchedProviders[network] = new JsonRpcBatchProvider({
      url,
      timeout,
      allowGzip: true
    });
  return batchedProviders[network];
}
