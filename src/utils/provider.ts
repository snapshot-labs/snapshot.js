import {
  JsonRpcBatchProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers';
import networks from '../networks.json';

const providers = {};

export default function getProvider(network: string, type = 'archive') {
  let url: any = networks[network].rpc[0];
  if (type === 'light' && networks[network].light?.length)
    url = networks[network].light[0];
  const connectionInfo =
    typeof url === 'object'
      ? { ...url, timeout: 25000 }
      : { url, timeout: 25000 };
  if (!providers[network] || !providers[network][type]) {
    providers[network] = { ...providers[network] };
    providers[network][type] = new StaticJsonRpcProvider(connectionInfo);
  }
  return providers[network][type];
}

export function getBatchedProvider(network: string, type = 'archive') {
  let url: any = networks[network].rpc[0];
  if (type === 'light' && networks[network].light?.length)
    url = networks[network].light[0];
  const connectionInfo =
    typeof url === 'object'
      ? { ...url, timeout: 25000 }
      : { url, timeout: 25000 };
  if (!providers[network] || !providers[network][type]) {
    providers[network] = { ...providers[network] };
    providers[network][type] = new JsonRpcBatchProvider(connectionInfo);
  }
  return providers[network][type];
}
