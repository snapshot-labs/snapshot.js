import { type ProviderOptions } from '../utils/provider';
import type { SignaturePayload } from '.';
export declare function getHash(data: SignaturePayload): string;
export default function verify(address: string, sig: string, data: SignaturePayload, network?: string, options?: ProviderOptions): Promise<boolean>;
