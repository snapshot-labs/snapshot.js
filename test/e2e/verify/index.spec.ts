import snapshot from '../../../src/';
import { Wallet } from '@ethersproject/wallet';
import { test, expect, describe } from 'vitest';
import { verify } from '../../../src/verify';

describe('verify', () => {
  test('should verify a signed message', async () => {
    const client = new snapshot.Client712();
    const wallet = Wallet.createRandom();
    const message = {
      from: wallet.address,
      alias: Wallet.createRandom().address
    };

    const receipt: any = await client.alias(wallet, wallet.address, message);
    const payload: any = await snapshot.utils.getJSON(receipt.ipfs);

    expect(verify(payload.address, payload.sig, payload.data)).resolves.toBe(
      true
    );
  });
});
