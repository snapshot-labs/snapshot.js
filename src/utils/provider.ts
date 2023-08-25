import {
  JsonRpcBatchProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers';

const providers = {};
const batchedProviders = {};

export default function getProvider(
  network,
  { broviderUrl = 'https://rpc.snapshot.org' } = {}
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
  { broviderUrl = 'https://rpc.snapshot.org' } = {}
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
