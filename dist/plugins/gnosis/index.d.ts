export default class Plugin {
    author: string;
    version: string;
    name: string;
    website: string;
    options: any;
    getTokenInfo(web3: any, tokenAddress: string): Promise<{
        address: string;
        checksumAddress: string;
        name: any;
        symbol: any;
    }>;
    getOmenCondition(network: number, conditionId: any): Promise<any>;
    getUniswapPair(network: number, token0: any, token1: any): Promise<any>;
}
