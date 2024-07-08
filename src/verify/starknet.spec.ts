import { test, expect, describe } from 'vitest';
import starknetMessage from '../../test/fixtures/starknet/message-alias.json';
import verify, { getHash } from './starknet';

describe('verify/starknet', () => {
  describe('getHash()', () => {
    test('should return a hash string', () => {
      const hash = getHash(starknetMessage.data, starknetMessage.address);
      expect(hash).toBe(
        '0x2513fb25c2147469748ec099bf849a21dde6c9b7cfb6b86af431b5e898309bd'
      );
    });

    test('should return a different by address', () => {
      const hash = getHash(starknetMessage.data, '0x0');
      expect(hash).not.toBe(
        '0x2513fb25c2147469748ec099bf849a21dde6c9b7cfb6b86af431b5e898309bd'
      );
    });
  });

  describe('verify()', () => {
    test('should return true if the signature is valid', () => {
      expect(
        verify(
          starknetMessage.address,
          starknetMessage.sig,
          starknetMessage.data,
          'SN_SEPOLIA'
        )
      ).resolves.toBe(true);
    });

    test('should throw an error if message is on wrong network', () => {
      expect(
        verify(
          starknetMessage.address,
          starknetMessage.sig,
          starknetMessage.data,
          'SN_MAIN'
        )
      ).rejects.toThrowError();
    });

    test('should throw an error if the signature is invalid', () => {
      expect(
        verify(
          '0x7667469b8e93faa642573078b6bf8c790d3a6184b2a1bb39c5c923a732862e1',
          starknetMessage.sig,
          starknetMessage.data
        )
      ).rejects.toThrow();
    });
  });
});
