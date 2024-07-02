import { test, expect, describe } from 'vitest';
import { verify } from './utils';
import evmMessage from '../../test/fixtures/evm/message-alias.json';
import starknetMessage from '../../test/fixtures/starknet/message-alias.json';

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
      test('should return true if the signature is valid', () => {
        expect(
          verify(
            starknetMessage.address,
            starknetMessage.sig,
            starknetMessage.data
          )
        ).resolves.toBe(true);
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
