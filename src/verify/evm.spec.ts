import { test, expect, describe } from 'vitest';
import evmMessage from '../../test/fixtures/evm/message-alias.json';
import eip6492Message from '../../test/fixtures/evm/eip-6492.json';
import eip1271Message from '../../test/fixtures/evm/eip-1271.json';
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

    test('should return true if the eip-1271 message signature is valid', async () => {
      expect(
        verify(eip1271Message.address, eip1271Message.sig, eip1271Message.data)
      ).resolves.toBe(true);
    });

    test('should reject if the eip-1271 message signer address is wrong', async () => {
      expect(
        verify(
          '0xDD983E11Cf84746f3b7589ee1Dc2081c08c40Cb3',
          eip1271Message.sig,
          eip1271Message.data
        )
      ).rejects.toThrowError(/isValidSignature/);
    });

    test('should reject if the eip-1271 message signature is invalid', async () => {
      const invalidMessageData = Object.assign({}, eip1271Message.data, {
        message: {
          ...eip1271Message.data.message,
          choices: [false]
        }
      });
      expect(
        verify(eip1271Message.address, eip1271Message.sig, invalidMessageData)
      ).rejects.toThrowError(/Hash not approved/);
    });

    test('should return true if the eip-6492 message signature is valid', async () => {
      expect(
        verify(eip6492Message.address, eip6492Message.sig, eip6492Message.data)
      ).resolves.toBe(true);
    });

    test('should reject if the eip-6492 message signer address is wrong', async () => {
      expect(
        verify(
          '0xDD983E11Cf84746f3b7589ee1Dc2081c08c40Cb3',
          eip6492Message.sig,
          eip6492Message.data
        )
      ).resolves.toBe(false);
    });

    test('should reject if the eip-6492 message signature is invalid', async () => {
      const invalidMessageData = Object.assign({}, eip6492Message.data, {
        message: {
          ...eip6492Message.data.message,
          choice: 3
        }
      });
      expect(
        verify(eip6492Message.address, eip6492Message.sig, invalidMessageData)
      ).resolves.toBe(false);
    });
  });
});
