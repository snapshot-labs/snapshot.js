import { test, expect, describe } from 'vitest';
import evmMessage from '../../test/fixtures/evm/message-alias.json';
import verify, { getHash } from './evm';

describe('verify/evm', () => {
  describe('getHash()', () => {
    test('should return a hash string', () => {
      const hash = getHash(evmMessage.data);
      expect(hash).toBe(
        '0x82ed8be33f43c86f9b83d14736e5762c89108fbc9b8b54f6e993818fc8a53525'
      );
    });
  });

  describe('verify()', () => {
    test('should return true if the signature is valid', () => {
      expect(
        verify(evmMessage.address, evmMessage.sig, evmMessage.data)
      ).resolves.toBe(true);
    });

    test('should throw an error if the signature is invalid', () => {
      expect(
        verify(
          '0xDD983E11Cf84746f3b7589ee1Dc2081c08c40Cb3',
          evmMessage.sig,
          evmMessage.data
        )
      ).rejects.toThrowError(/isValidSignature/);
    });
  });
});
