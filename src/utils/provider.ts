import { StaticJsonRpcProvider } from '@ethersproject/providers';
import networks from '../networks.json';

const providers = {};

export default function getProvider(network: string, rpcIndex = 0) {
  const url: string = networks[network].rpc[rpcIndex];
  if (!providers[network]) providers[network] = new StaticJsonRpcProvider(url);
  return providers[network];
}
