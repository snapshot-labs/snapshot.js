import {
  JsonRpcBatchProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers';
import networks from '../networks.json';

const providers = {};

export default function getProvider(network: string, type = 'archive') {
  let url: any = networks[network].rpc[0];
  if(type === 'non-archive' && networks[network].nonArchiveRPC?.length) {
    url =  networks[network].nonArchiveRPC[0];
  }
  const connectionInfo = typeof url === 'object' ? {...url, timeout: 25000} : {url, timeout: 25000};
  if (!providers[network]) providers[network] = new StaticJsonRpcProvider(connectionInfo);
  return providers[network];
}

export function getBatchedProvider(network: string, type = 'archive') {
  let url: any = networks[network].rpc[0];
  if(type === 'non-archive' && networks[network].nonArchiveRPC?.length) {
    url =  networks[network].nonArchiveRPC[0];
  }
  if (!providers[network]) providers[network] = new JsonRpcBatchProvider(url);
  return providers[network];
}
