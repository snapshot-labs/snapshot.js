import { StaticJsonRpcProvider } from '@ethersproject/providers';
import set from 'lodash.set';
import { RpcProvider } from 'starknet';
import { multicall } from './';

type Path = string | number | number[] | string[];

export default class Multicaller {
  public network: string;
  public provider: StaticJsonRpcProvider | RpcProvider;
  public abi: any[];
  public options: any = {};
  public calls: any[] = [];
  public paths: Path[] = [];

  constructor(
    network: string,
    provider: StaticJsonRpcProvider | RpcProvider,
    abi: any[],
    options: any = {}
  ) {
    this.network = network;
    this.provider = provider;
    this.abi = abi;
    this.options = options;
  }

  call(path: Path, address: string, fn: string, params?: any[]): Multicaller {
    this.calls.push([address, fn, params]);
    this.paths.push(path);
    return this;
  }

  async execute(from?: any): Promise<any> {
    const obj = from || {};
    const result = await multicall(
      this.network,
      this.provider,
      this.abi,
      this.calls,
      this.options
    );
    result.forEach((r: any, i: number) =>
      set(obj, this.paths[i], r.length > 1 ? r : r[0])
    );
    this.calls = [];
    this.paths = [];
    return obj;
  }
}
