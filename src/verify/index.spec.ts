import { test, expect, describe, vi } from 'vitest';
import { verify } from '.';
import evmMessage from '../../test/fixtures/evm/message-alias.json';
import starknetMessage from '../../test/fixtures/starknet/message-alias.json';
import * as evmVerification from './evm';
import * as starknetVerification from './starknet';

const evmVerificationMock = vi.spyOn(evmVerification, 'default');
const starknetVerificationMock = vi.spyOn(starknetVerification, 'default');
evmVerificationMock.mockImplementation(() => Promise.resolve(true));
starknetVerificationMock.mockImplementation(() => Promise.resolve(true));

describe('sign/utils', () => {
  describe('verify', () => {
    test('should call EVM verification on EVM address', async () => {
      expect.assertions(1);
      await verify(evmMessage.address, evmMessage.sig, evmMessage.data);

      expect(evmVerificationMock).toHaveBeenCalled();
    });

    test('should call Starknet verification on Starknet address', async () => {
      expect.assertions(1);
      await verify(
        starknetMessage.address,
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
