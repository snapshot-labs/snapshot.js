import { describe, expect, test } from 'vitest';
import getProvider, { getBatchedProvider } from '../../../src/utils/provider';

describe('test providers', () => {
  describe('getProvider', () => {
    test('should return a provider for EVM networks', async () => {
      expect(getProvider('1').getNetwork()).resolves.toEqual(
        expect.objectContaining({
          chainId: 1
        })
      );
    });

    test('should accept a network param as number', async () => {
      expect(getProvider(1).getNetwork()).resolves.toEqual(
        expect.objectContaining({
          chainId: 1
        })
      );
    });

    test('should return a provider for Starknet networks', async () => {
      expect(getProvider('0x534e5f4d41494e').getChainId()).resolves.toEqual(
        '0x534e5f4d41494e'
      );
    });

    test('should throw an error for unsupported networks', () => {
      expect(() => getProvider('0x123')).toThrowError(
        'Network 0x123 is not supported'
      );
    });
  });

  describe('getBatchedProvider', () => {
    test('should return a batch provider for EVM networks', async () => {
      const provider = getBatchedProvider('1');
      const requests = [provider.getNetwork(), provider.getBlockNumber()];

      expect(Promise.all(requests)).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            chainId: 1
          }),
          expect.any(Number)
        ])
      );
    });

    test('should return a batch provider for starknet networks', async () => {
      const provider = getBatchedProvider('0x534e5f4d41494e');
      const requests = [provider.getChainId(), provider.getBlockNumber()];

      expect(Promise.all(requests)).resolves.toEqual(
        expect.arrayContaining(['0x534e5f4d41494e', expect.any(Number)])
      );
    });

    test('should throw an error for unsupported networks', () => {
      expect(() => getBatchedProvider('0x123')).toThrowError(
        'Network 0x123 is not supported'
      );
    });
  });
});
