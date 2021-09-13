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
    console.log(e);
    return false;
  }
  return returnValue.toLowerCase() === magicValue.toLowerCase();
}

export async function verifyOldVersion(
  address: string,
  sig: string,
  hash: string,
  provider: StaticJsonRpcProvider
) {
  let returnValue;
  const magicValue = '0x20c13b0b';
  const abi =
    'function isValidSignature(bytes _hash, bytes memory _signature) public view returns (bytes4 magicValue)';
  try {
    returnValue = await call(
      provider,
      [abi],
      [address, 'isValidSignature', [arrayify(hash), sig]]
    );
  } catch (e) {
    console.log(e);
    return false;
  }
  return returnValue.toLowerCase() === magicValue.toLowerCase();
}

export async function verify(address, sig, hash, network = '1') {
  const provider = getProvider(network);
  if (await verifyDefault(address, sig, hash, provider)) return true;
  return await verifyOldVersion(address, sig, hash, provider);
}
