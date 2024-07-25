import { test, expect, describe } from 'vitest';
import starknetMessage from '../../test/fixtures/starknet/message-alias.json';
import starknetMessageRsv from '../../test/fixtures/starknet/message-alias-rsv.json';
import verify, { getHash } from './starknet';
import { validateAndParseAddress } from 'starknet';
import { clone } from '../utils';

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
    describe.each([
      ['2', starknetMessage],
      ['3', starknetMessageRsv]
    ])('with a %s items signature', (title, message) => {
      test('should return true if the signature is valid', () => {
        expect(
          verify(message.address, message.sig, message.data, 'SN_MAIN')
        ).resolves.toBe(true);
      });

      test('should return true if the signature is valid with a padded address', () => {
        expect(
          verify(
            validateAndParseAddress(message.address),
            message.sig,
            message.data,
            'SN_MAIN'
          )
        ).resolves.toBe(true);
      });

      test('should return true when verifying on a different network', () => {
        expect(
          verify(message.address, message.sig, message.data, 'SN_SEPOLIA')
        ).resolves.toBe(true);
      });

      test('should throw an error if the signature is invalid', () => {
        expect(
          verify(
            '0x7667469b8e93faa642573078b6bf8c790d3a6184b2a1bb39c5c923a732862e1',
            message.sig,
            message.data
          )
        ).rejects.toThrow();
      });
    });

    test('should throw an error when the contract is not deployed', () => {
      expect(
        verify(
          '0x07f71118e351c02f6EC7099C8CDf93AED66CEd8406E94631cC91637f7D7F203A',
          starknetMessage.sig,
          starknetMessage.data,
          'SN_MAIN'
        )
      ).rejects.toThrowError('Contract not deployed');
    });

    test('should return false when the signature is not valid', () => {
      expect(
        verify(
          starknetMessage.address,
          ['1', '2'],
          starknetMessage.data,
          'SN_MAIN'
        )
      ).resolves.toBe(false);
    });

    test('should return false when the signature is not valid', () => {
      const data = clone(starknetMessage.data);
      data.message.timestamp = 1234;

      expect(
        verify(starknetMessage.address, starknetMessage.sig, data, 'SN_MAIN')
      ).resolves.toBe(false);
    });

    test('should throw an error on wrong signature length', () => {
      expect(
        verify(starknetMessage.address, ['1'], starknetMessage.data, 'SN_MAIN')
      ).rejects.toThrowError('Invalid signature format');
    });
  });
});
