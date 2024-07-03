import { verifyTypedData } from '@ethersproject/wallet';
import { arrayify } from '@ethersproject/bytes';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { getHash, SignaturePayload } from '.';
import getProvider, { ProviderOptions } from '../utils/provider';
import { call } from '../utils';

function isSameAddress(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
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
    if (isSameAddress(address, recoverAddress)) return true;
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
) {
  let returnValue;
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

  return isSameAddress(returnValue, magicValue);
}

async function verifyOldVersion(
  address: string,
  sig: string,
  hash: string,
  provider: StaticJsonRpcProvider
) {
  const magicValue = '0x20c13b0b';
  const abi =
    'function isValidSignature(bytes _hash, bytes memory _signature) public view returns (bytes4 magicValue)';

  const returnValue = await call(
    provider,
    [abi],
    [address, 'isValidSignature', [arrayify(hash), sig]]
  );
  return isSameAddress(returnValue, magicValue);
}
