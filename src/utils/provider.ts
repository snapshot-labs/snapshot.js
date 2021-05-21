import { StaticJsonRpcProvider } from '@ethersproject/providers';
import networks from '../networks.json';

const providers = {};

export default function getProvider(network: string) {
  const url: string = networks[network].rpc[0];
  if (!providers[network]) providers[network] = new StaticJsonRpcProvider(url);
  return providers[network];
}
