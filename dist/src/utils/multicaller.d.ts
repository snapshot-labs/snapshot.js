import { StaticJsonRpcProvider } from '@ethersproject/providers';
export default class Multicaller {
    network: string;
    provider: StaticJsonRpcProvider;
    abi: any[];
    options: any;
    calls: any[];
    paths: any[];
    constructor(network: string, provider: StaticJsonRpcProvider, abi: any[], options?: any);
    call(path: any, address: any, fn: any, params?: any): Multicaller;
    execute(from?: any): Promise<any>;
}
