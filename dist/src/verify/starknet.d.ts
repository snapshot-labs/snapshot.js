import type { SignaturePayload } from '.';
import type { ProviderOptions } from '../utils/provider';
export type NetworkType = 'SN_MAIN' | 'SN_SEPOLIA';
export declare function isStarknetMessage(data: SignaturePayload): boolean;
export declare function getHash(data: SignaturePayload, address: string): string;
export default function verify(address: string, sig: string[], data: SignaturePayload, network?: NetworkType, options?: ProviderOptions): Promise<boolean>;
