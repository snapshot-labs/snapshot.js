import { test, expect, describe } from 'vitest';
import { getHash, verify } from '../sign/utils';
import evmMessage from '../../test/fixtures/evm/message-alias.json';

describe('sign/utils', () => {
  describe('getHash', () => {
    test('should return a hash string', () => {
      const hash = getHash(evmMessage.data);
      expect(hash).toBe(
        '0x82ed8be33f43c86f9b83d14736e5762c89108fbc9b8b54f6e993818fc8a53525'
      );
    });
  });

  describe('verify', () => {
    test.todo('should call EVM verification on EVM address');

    test.todo('should call Starknet verification on Starknet address');

    test('should throw an error on empty address', () => {
      expect(
        verify('', evmMessage.sig, evmMessage.data)
      ).rejects.toThrowError();
    });

    test('should throw an error on invalid address', () => {
      expect(
        verify('hello-world', evmMessage.sig, evmMessage.data)
      ).rejects.toThrowError();
    });
  });
});
