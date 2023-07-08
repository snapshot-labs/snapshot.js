import {
  JsonRpcBatchProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers';

const providers = {};
const batchedProviders = {};

export default function getProvider(network) {
  const url = `https://rpc.snapshot.org/${network}`;
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

export function getBatchedProvider(network) {
  const url = `https://rpc.snapshot.org/${network}`;
  if (!batchedProviders[network])
    batchedProviders[network] = new JsonRpcBatchProvider({
      url,
      timeout: 25000,
      allowGzip: true
    });
  return batchedProviders[network];
}
