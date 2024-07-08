import {
  JsonRpcBatchProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers';

const providers = {};
const batchedProviders = {};

export type ProviderOptions = {
  broviderUrl?: string;
};

const DEFAULT_BROVIDER_URL = 'https://rpc.snapshot.org';

export default function getProvider(
  network,
  { broviderUrl = DEFAULT_BROVIDER_URL }: ProviderOptions = {}
) {
  const url = `${broviderUrl}/${network}`;
  if (!providers[network])
    providers[network] = new StaticJsonRpcProvider(
      {
        url,
        timeout: 25000,
        allowGzip: true
      },
      Number(network)
    );
  return providers[network];
}

export function getBatchedProvider(
  network,
  { broviderUrl = DEFAULT_BROVIDER_URL }: ProviderOptions = {}
) {
  const url = `${broviderUrl}/${network}`;
  if (!batchedProviders[network])
    batchedProviders[network] = new JsonRpcBatchProvider({
      url,
      timeout: 25000,
      allowGzip: true
    });
  return batchedProviders[network];
}
