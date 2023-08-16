import { arrayify } from '@ethersproject/bytes';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import getProvider from '../utils/provider';
import { call } from '../utils';

export async function verifyDefault(
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
  } catch (e) {
    // @ts-ignore
    if (e.message.startsWith('missing revert data in call exception')) {
      return false;
    }
    throw e;
  }

  return returnValue.toLowerCase() === magicValue.toLowerCase();
}

export async function verifyOldVersion(
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
  return returnValue.toLowerCase() === magicValue.toLowerCase();
}

export async function verify(address, sig, hash, network = '1', options = {}) {
  const provider = getProvider(network, options);
  if (await verifyDefault(address, sig, hash, provider)) return true;
  return await verifyOldVersion(address, sig, hash, provider);
}
