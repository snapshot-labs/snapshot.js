import { describe, expect, test } from 'vitest';
import getProvider from '../../../src/utils/provider';
import { RpcProvider } from 'starknet';

describe('test providers', () => {
  describe('getProvider()', () => {
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
        "Network '0x123' is not supported"
      );
    });

    test('should memoize providers with same network and options', () => {
      const provider1 = getProvider('1');
      const provider2 = getProvider('1');
      const provider3 = getProvider(1); // Different type but same network

      expect(provider1).toBe(provider2);
      expect(provider1).toBe(provider3);
    });

    test('should create different instances for different options', () => {
      const provider1 = getProvider('1');
      const provider2 = getProvider('1', { timeout: 30000 });
      const provider3 = getProvider('1', { broviderUrl: 'https://custom.rpc' });

      expect(provider1).not.toBe(provider2);
      expect(provider1).not.toBe(provider3);
      expect(provider2).not.toBe(provider3);
    });

    test('should memoize providers with identical custom options', () => {
      const options = { timeout: 30000, broviderUrl: 'https://custom.rpc' };
      const provider1 = getProvider('1', options);
      const provider2 = getProvider('1', { ...options });
      const provider3 = getProvider('1', {
        timeout: 30000,
        broviderUrl: 'https://custom.rpc'
      });

      expect(provider1).toBe(provider2);
      expect(provider1).toBe(provider3);
    });

    test('should create separate instances for different networks', () => {
      const ethProvider = getProvider('1');
      const bscProvider = getProvider('56');
      const starknetProvider = getProvider('0x534e5f4d41494e');

      expect(ethProvider).not.toBe(bscProvider);
      expect(ethProvider).not.toBe(starknetProvider);
      expect(bscProvider).not.toBe(starknetProvider);
    });
  });

  describe('memoization edge cases', () => {
    test('should handle undefined vs default options correctly', () => {
      const provider1 = getProvider('1');
      const provider2 = getProvider('1', {});
      const provider3 = getProvider('1', {
        broviderUrl: 'https://rpc.snapshot.org',
        timeout: 25000
      });

      expect(provider1).toBe(provider2);
      expect(provider1).toBe(provider3);
    });

    test('should handle Starknet provider memoization', () => {
      const provider1 = getProvider('0x534e5f4d41494e');
      const provider2 = getProvider('0x534e5f4d41494e', {});

      expect(provider1).toBe(provider2);
    });

    test('should memoize across EVM and Starknet provider types', () => {
      const evmProvider1 = getProvider('1');
      const evmProvider2 = getProvider('1');
      const starknetProvider1 = getProvider('0x534e5f4d41494e');
      const starknetProvider2 = getProvider('0x534e5f4d41494e');

      expect(evmProvider1).toBe(evmProvider2);
      expect(starknetProvider1).toBe(starknetProvider2);
      expect(evmProvider1).not.toBe(starknetProvider1);
    });

    test('should handle nullish values in options correctly', () => {
      const provider1 = getProvider('1', { timeout: undefined });
      const provider2 = getProvider('1', { broviderUrl: null as any });
      const provider3 = getProvider('1');

      expect(provider1).toBe(provider3);
      expect(provider2).toBe(provider3);
    });
  });

  describe('error handling and validation', () => {
    test('should throw descriptive errors for invalid networks', () => {
      const invalidNetworks = [
        'invalid',
        999,
        '0xInvalid',
        '',
        null,
        undefined
      ];

      invalidNetworks.forEach((network) => {
        expect(() => getProvider(network as any)).toThrow(
          /Network .* is not supported/
        );
      });
    });

    test('should validate network types consistently', () => {
      // String and number representations should work identically
      const networks = [
        ['1', 1],
        ['56', 56],
        ['137', 137]
      ];

      networks.forEach(([strNetwork, numNetwork]) => {
        expect(() => getProvider(strNetwork)).not.toThrow();
        expect(() => getProvider(numNetwork)).not.toThrow();
        expect(getProvider(strNetwork)).toBe(getProvider(numNetwork));
      });
    });
  });

  describe('provider type consistency', () => {
    test('should return correct provider types for EVM networks', () => {
      const evmProvider = getProvider('1');

      expect(evmProvider.constructor.name).toMatch(/StaticJsonRpcProvider/);
    });

    test('should return correct provider types for Starknet networks', () => {
      const starknetProvider = getProvider('0x534e5f4d41494e');

      expect(starknetProvider).toBeInstanceOf(RpcProvider);
    });

    test('should preserve provider configuration in memoized instances', () => {
      const customOptions = {
        timeout: 15000,
        broviderUrl: 'https://custom.snapshot.org'
      };

      const provider1 = getProvider('1', customOptions);
      const provider2 = getProvider('1', customOptions);

      expect(provider1).toBe(provider2);
      // Verify the provider was configured with custom options
      expect(provider1.connection.timeout).toBe(15000);
      expect(provider1.connection.url).toContain('custom.snapshot.org');
    });
  });
});
