export type ProviderOptions = {
    broviderUrl?: string;
    timeout?: number;
};
export default function getProvider(network: any, { broviderUrl, timeout }?: ProviderOptions): any;
export declare function getBatchedProvider(network: any, { broviderUrl, timeout }?: ProviderOptions): any;
