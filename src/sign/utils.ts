import { verifyTypedData } from '@ethersproject/wallet';
import { _TypedDataEncoder } from '@ethersproject/hash';
import { verify as verifyEIP1271 } from './eip1271';

export function getHash(data) {
  const { domain, types, message } = data;
  return _TypedDataEncoder.hash(domain, types, message);
}

export async function verify(address, sig, data) {
  const { domain, types, message } = data;
  const recoverAddress = verifyTypedData(domain, types, message, sig);
  const hash = getHash(data);
  console.log('Hash', hash);
  console.log('Address', address);
  console.log('Recover address', recoverAddress);
  if (address === recoverAddress) return true;
  console.log('Check EIP1271 signature');
  return await verifyEIP1271(address, sig, hash);
}
