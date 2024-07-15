import { test, expect, describe, vi } from 'vitest';
import { verify, getHash } from '.';
import evmMessage from '../../test/fixtures/evm/message-alias.json';
import starknetMessage from '../../test/fixtures/starknet/message-alias.json';
import * as evmVerification from './evm';
import * as starknetVerification from './starknet';

const evmVerificationMock = vi.spyOn(evmVerification, 'default');
const starknetVerificationMock = vi.spyOn(starknetVerification, 'default');
evmVerificationMock.mockImplementation(() => Promise.resolve(true));
starknetVerificationMock.mockImplementation(() => Promise.resolve(true));

const evmGetHashMock = vi.spyOn(evmVerification, 'getHash');
const starknetGetHashMock = vi.spyOn(starknetVerification, 'getHash');
evmGetHashMock.mockImplementation(() => '');
starknetGetHashMock.mockImplementation(() => '');

describe('sign/utils', () => {
  describe('getHash', () => {
    test('should return an EVM hash on EVM address', () => {
      expect.assertions(1);
      getHash(evmMessage.data, evmMessage.address);

      expect(evmGetHashMock).toHaveBeenCalled();
    });

    test('should return a Starknet hash on starknet payload and starknet address', () => {
      expect.assertions(1);
      getHash(starknetMessage.data, starknetMessage.address);

      expect(starknetGetHashMock).toHaveBeenCalled();
    });

    test('should return a Starknet hash on starknet payload and EVM address', () => {
      expect.assertions(1);
      getHash(starknetMessage.data, evmMessage.address);

      expect(starknetGetHashMock).toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    test('should call EVM verification on EVM address', async () => {
      expect.assertions(1);
      await verify(evmMessage.address, evmMessage.sig, evmMessage.data);

      expect(evmVerificationMock).toHaveBeenCalled();
    });

    test('should call Starknet verification on Starknet payload', async () => {
      expect.assertions(1);
      await verify(
        starknetMessage.address,
        starknetMessage.sig,
        starknetMessage.data
      );

      expect(starknetVerificationMock).toHaveBeenCalled();
    });

    test('should call Starknet verification on Starknet payload and EVM message', async () => {
      expect.assertions(1);
      await verify(
        evmMessage.address,
        starknetMessage.sig,
        starknetMessage.data
      );

      expect(starknetVerificationMock).toHaveBeenCalled();
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
