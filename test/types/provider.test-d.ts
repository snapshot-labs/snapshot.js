import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import type { RpcProvider } from 'starknet';
import { constants } from 'starknet';
import getProvider from '../../src/utils/provider';
import snapshot from '../../src/index';

declare const widenedString: string;
declare const widenedNumber: number;
declare const untyped: any;

export const starknetMainnet: RpcProvider = getProvider('0x534e5f4d41494e');
export const starknetSepolia: RpcProvider = getProvider(
  '0x534e5f5345504f4c4941'
);
export const starknetFromChainId: RpcProvider = getProvider(
  constants.StarknetChainId.SN_MAIN
);
export const ethereum: StaticJsonRpcProvider = getProvider('1');
export const ethereumAsNumber: StaticJsonRpcProvider = getProvider(1);
export const fromWidenedString: StaticJsonRpcProvider =
  getProvider(widenedString);
export const fromWidenedNumber: StaticJsonRpcProvider =
  getProvider(widenedNumber);
export const fromUntyped: StaticJsonRpcProvider = getProvider(untyped);

export const throughPublicSurface: RpcProvider =
  snapshot.utils.getProvider('0x534e5f4d41494e');
export const throughPublicSurfaceEvm: StaticJsonRpcProvider =
  snapshot.utils.getProvider('1');

// @ts-expect-error a Starknet network resolves to starknet.js, not ethers
export const notEthers: StaticJsonRpcProvider = getProvider('0x534e5f4d41494e');

// @ts-expect-error an EVM network resolves to ethers, not starknet.js
export const notStarknet: RpcProvider = getProvider('1');

// @ts-expect-error a network the compiler cannot pin resolves to ethers
export const notStarknetFromUntyped: RpcProvider = getProvider(untyped);

// @ts-expect-error a network the compiler cannot pin resolves to ethers
export const notStarknetFromWidened: RpcProvider = getProvider(widenedString);
