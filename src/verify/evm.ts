import { verifyTypedData } from '@ethersproject/wallet';
import { _TypedDataEncoder } from '@ethersproject/hash';
import { arrayify } from '@ethersproject/bytes';
import getProvider, { type ProviderOptions } from '../utils/provider';
import { call } from '../utils';
import type { SignaturePayload } from '.';
import type { StaticJsonRpcProvider } from '@ethersproject/providers';

function isEqual(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

export function getHash(data: SignaturePayload): string {
  const { domain, types, message } = data;
  return _TypedDataEncoder.hash(domain, types, message);
}

export default async function verify(
  address: string,
  sig: string,
  data: SignaturePayload,
  network = '1',
  options: ProviderOptions = {}
): Promise<boolean> {
  const { domain, types, message } = data;

  try {
    const recoverAddress = verifyTypedData(domain, types, message, sig);
    if (isEqual(address, recoverAddress)) return true;
  } catch (e: any) {}

  const provider = getProvider(network, options);
  const hash = getHash(data);

  if (await verifyDefault(address, sig, hash, provider)) return true;

  return await verifyOldVersion(address, sig, hash, provider);
}

async function verifyDefault(
  address: string,
  sig: string,
  hash: string,
  provider: StaticJsonRpcProvider
): Promise<boolean> {
  let returnValue: string;
  const magicValue = '0x1626ba7e';
  const abi =
    'function isValidSignature(bytes32 _hash, bytes memory _signature) public view returns (bytes4 magicValue)';
  try {
    returnValue = await call(
      provider,
      [abi],
      [address, 'isValidSignature', [arrayify(hash), sig]]
    );
  } catch (e: any) {
    if (e.message.startsWith('missing revert data in call exception')) {
      return false;
    }
    throw e;
  }

  return isEqual(returnValue, magicValue);
}

async function verifyOldVersion(
  address: string,
  sig: string,
  hash: string,
  provider: StaticJsonRpcProvider
): Promise<boolean> {
  const magicValue = '0x20c13b0b';
  const abi =
    'function isValidSignature(bytes _hash, bytes memory _signature) public view returns (bytes4 magicValue)';

  const returnValue = await call(
    provider,
    [abi],
    [address, 'isValidSignature', [arrayify(hash), sig]]
  );
  return isEqual(returnValue, magicValue);
}
