import Multicaller from './utils/multicaller';
import { getSnapshots } from './utils/blockfinder';
import getProvider from './utils/provider';
import { signMessage, getBlockNumber } from './utils/web3';
import { getHash, verify } from './verify';
import getDelegatesBySpace, { SNAPSHOT_SUBGRAPH_URL } from './utils/delegation';
interface Options {
    url?: string;
    headers?: any;
}
interface Strategy {
    name: string;
    network?: string;
    params: any;
}
export declare function call(provider: any, abi: any[], call: any[], options?: any): Promise<any>;
export declare function multicall(network: string, provider: any, abi: any[], calls: any[], options?: any): Promise<any>;
export declare function subgraphRequest(url: string, query: any, options?: any): Promise<any>;
export declare function getUrl(uri: any, gateway?: string): any;
export declare function getJSON(uri: any, options?: any): Promise<any>;
export declare function ipfsGet(gateway: string, ipfsHash: string, protocolType?: string): Promise<any>;
export declare function sendTransaction(web3: any, contractAddress: string, abi: any[], action: string, params: any[], overrides?: {}): Promise<any>;
export declare function getScores(space: string, strategies: Strategy[], network: string, addresses: string[], snapshot?: number | string, scoreApiUrl?: string, options?: any): Promise<any>;
export declare function getVp(address: string, network: string, strategies: Strategy[], snapshot: number | 'latest', space: string, delegation: boolean, options?: Options): Promise<any>;
export declare function validate(validation: string, author: string, space: string, network: string, snapshot: number | 'latest', params: any, options?: Options): Promise<any>;
interface validateSchemaOptions {
    snapshotEnv?: string;
    spaceType?: string;
}
export declare function validateSchema(schema: any, data: any, options?: validateSchemaOptions): true | import("ajv").ErrorObject<string, Record<string, any>, unknown>[] | null | undefined;
export declare function getEnsTextRecord(ens: string, record: string, network?: string, options?: any): Promise<string | null>;
export declare function getSpaceUri(id: string, network?: string, options?: any): Promise<string | null>;
export declare function getEnsOwner(ens: string, network?: string, options?: any): Promise<string>;
export declare function getSpaceController(id: string, network?: string, options?: any): Promise<string>;
export declare function clone(item: any): any;
export declare function sleep(time: any): Promise<unknown>;
export declare function getNumberWithOrdinal(n: any): string;
export declare function isStarknetAddress(address: string): boolean;
export declare function isEvmAddress(address: string): boolean;
export declare function getFormattedAddress(address: string, format: 'evm' | 'starknet'): string;
export { getDelegatesBySpace, SNAPSHOT_SUBGRAPH_URL };
declare const _default: {
    call: typeof call;
    multicall: typeof multicall;
    subgraphRequest: typeof subgraphRequest;
    ipfsGet: typeof ipfsGet;
    getUrl: typeof getUrl;
    getJSON: typeof getJSON;
    sendTransaction: typeof sendTransaction;
    getScores: typeof getScores;
    getVp: typeof getVp;
    validateSchema: typeof validateSchema;
    getEnsTextRecord: typeof getEnsTextRecord;
    getSpaceUri: typeof getSpaceUri;
    getEnsOwner: typeof getEnsOwner;
    getSpaceController: typeof getSpaceController;
    getDelegatesBySpace: typeof getDelegatesBySpace;
    clone: typeof clone;
    sleep: typeof sleep;
    getNumberWithOrdinal: typeof getNumberWithOrdinal;
    voting: {
        'single-choice': typeof import("./voting/singleChoice").default;
        approval: typeof import("./voting/approval").default;
        quadratic: typeof import("./voting/quadratic").default;
        'ranked-choice': typeof import("./voting/rankedChoice").default;
        copeland: typeof import("./voting/copeland").default;
        weighted: typeof import("./voting/weighted").default;
        basic: typeof import("./voting/singleChoice").default;
    };
    getProvider: typeof getProvider;
    signMessage: typeof signMessage;
    getBlockNumber: typeof getBlockNumber;
    Multicaller: typeof Multicaller;
    getSnapshots: typeof getSnapshots;
    getHash: typeof getHash;
    verify: typeof verify;
    validate: typeof validate;
    isStarknetAddress: typeof isStarknetAddress;
    isEvmAddress: typeof isEvmAddress;
    getFormattedAddress: typeof getFormattedAddress;
    SNAPSHOT_SUBGRAPH_URL: {
        "1": string;
        "10": string;
        "56": string;
        "100": string;
        "137": string;
        "146": string;
        "250": string;
        "5000": string;
        "8453": string;
        "42161": string;
        "59144": string;
        "81457": string;
        "84532": string;
        "11155111": string;
    };
};
export default _default;
