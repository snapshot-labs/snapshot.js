import type { StarkNetType } from 'starknet';
import type { TypedDataField } from '@ethersproject/abstract-signer';
import type { ProviderOptions } from '../utils/provider';
export type SignaturePayload = {
    domain: Record<string, string | number>;
    types: Record<string, StarkNetType[] | TypedDataField[]>;
    primaryType?: string;
    message: Record<string, any>;
};
export declare function getHash(data: SignaturePayload, address?: string): string;
export declare function verify(address: string, sig: string | string[], data: SignaturePayload, network?: string, options?: ProviderOptions): Promise<boolean>;
