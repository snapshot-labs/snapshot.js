import { test, expect, describe } from 'vitest';
import { verify } from './utils';
import evmMessage from '../../test/fixtures/evm/message-alias.json';

describe('sign/utils', () => {
  describe('verify', () => {
    describe('with an EVM address', () => {
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

    describe('with a Starknet address', () => {
      test.todo('should return true if the signature is valid');
      test.todo('should throw an error if the signature is invalid');
    });
  });
});
