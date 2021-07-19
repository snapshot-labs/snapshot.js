import { hexlify } from '@ethersproject/bytes';

export async function signMessage(web3, msg, address) {
  msg = hexlify(new Buffer(msg, 'utf8'));
  return await web3.send('personal_sign', [msg, address]);
}

export async function getBlockNumber(provider) {
  try {
    const blockNumber: any = await provider.getBlockNumber();
    return parseInt(blockNumber);
  } catch (e) {
    return Promise.reject();
  }
}
