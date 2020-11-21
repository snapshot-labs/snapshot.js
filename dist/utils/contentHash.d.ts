import { Provider } from '@ethersproject/abstract-provider';
export declare function decodeContenthash(encoded: any): {
    protocolType: any;
    decoded: any;
    error?: undefined;
} | {
    protocolType: any;
    decoded: any;
    error: any;
};
export declare function validateContent(encoded: any): any;
export declare function isValidContenthash(encoded: any): boolean;
export declare function encodeContenthash(text: any): any;
/**
 * Fetches and decodes the result of an ENS contenthash lookup on mainnet to a URI
 * @param ensName to resolve
 * @param provider provider to use to fetch the data
 */
export declare function resolveENSContentHash(ensName: string, provider: Provider): Promise<string>;
