import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { AddressInfo, createServer, Server, Socket } from 'net';
import crossFetch from 'cross-fetch';
import getProvider, { withTimeout } from '../../../src/utils/provider';
import { getViemClient } from '../../../src/utils/viem';
import { RpcProvider } from 'starknet';

const STARKNET_NETWORK = '0x534e5f4d41494e';
const DEFAULT_TIMEOUT = 25000;

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

  describe('getViemClient()', () => {
    test('should return a client for EVM networks', async () => {
      expect(getViemClient('1').getChainId()).resolves.toBe(1);
    });

    test('should accept a network param as number', async () => {
      expect(getViemClient(1).getChainId()).resolves.toBe(1);
    });

    test('should throw an error for unsupported networks', () => {
      expect(() => getViemClient('0x123')).toThrowError(
        "Network '0x123' is not supported"
      );
    });

    test('should throw an error for non-EVM networks', () => {
      expect(() => getViemClient('0x534e5f4d41494e')).toThrowError(
        "Network '0x534e5f4d41494e' is not supported"
      );
    });

    test('should memoize clients with same network and options', () => {
      const client1 = getViemClient('1');
      const client2 = getViemClient('1');
      const client3 = getViemClient(1); // Different type but same network

      expect(client1).toBe(client2);
      expect(client1).toBe(client3);
    });

    test('should create different instances for different options', () => {
      const client1 = getViemClient('1');
      const client2 = getViemClient('1', { timeout: 30000 });
      const client3 = getViemClient('1', { broviderUrl: 'https://custom.rpc' });

      expect(client1).not.toBe(client2);
      expect(client1).not.toBe(client3);
      expect(client2).not.toBe(client3);
    });

    test('should create separate instances for different networks', () => {
      expect(getViemClient('1')).not.toBe(getViemClient('56'));
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

describe('Starknet provider timeout', () => {
  // Accepts the connection and then never answers. This is the failure mode
  // that matters: a refused connection fails fast on its own, a hung node does
  // not, and starknet.js has no timeout of its own to fall back on.
  let server: Server;
  let sockets: Socket[] = [];
  let broviderUrl: string;

  beforeAll(async () => {
    server = createServer((socket) => sockets.push(socket));
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', () => resolve())
    );
    broviderUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    sockets.forEach((socket) => socket.destroy());
    sockets = [];
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('rejects a hung request instead of hanging', async () => {
    const provider = getProvider(STARKNET_NETWORK, {
      broviderUrl,
      timeout: 300
    });
    const start = Date.now();

    await expect(provider.getSpecVersion()).rejects.toThrow(
      'Request timeout after 300ms'
    );

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(300);
    expect(elapsed).toBeLessThan(3000);
  });

  test('rejects with the same error code as the EVM provider', async () => {
    const provider = getProvider(STARKNET_NETWORK, {
      broviderUrl,
      timeout: 400
    });

    await expect(provider.getSpecVersion()).rejects.toMatchObject({
      code: 'TIMEOUT'
    });
  });

  test('lets a caller abort cancel a hung request before the timeout', async () => {
    // The fetch we actually ship, against the same hung node: an abort from
    // above has to reach the socket rather than sit behind the 5s timeout.
    const caller = new AbortController();
    const start = Date.now();
    const request = withTimeout(crossFetch, 5000)(broviderUrl, {
      method: 'POST',
      body: '{}',
      signal: caller.signal
    });
    setTimeout(() => caller.abort(), 50);

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(Date.now() - start).toBeLessThan(1000);
  });

  test('applies the default timeout when none is passed', async () => {
    // Fake only the timers this uses, so the pending socket is untouched and
    // the suite does not sit here for the full 25s.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    try {
      const provider = getProvider(STARKNET_NETWORK, { broviderUrl });
      const assertion = expect(provider.getSpecVersion()).rejects.toThrow(
        `Request timeout after ${DEFAULT_TIMEOUT}ms`
      );

      await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('withTimeout()', () => {
  const response = new Response('{}');

  test('calls the wrapped fetch and preserves its init', async () => {
    const baseFetch = vi.fn().mockResolvedValue(response);
    const init = { method: 'POST', body: '{}', headers: { a: 'b' } };

    await expect(
      withTimeout(baseFetch, 1000)('https://rpc.test', init)
    ).resolves.toBe(response);
    expect(baseFetch).toHaveBeenCalledWith(
      'https://rpc.test',
      expect.objectContaining({ ...init, signal: expect.any(AbortSignal) })
    );
  });

  test('returns the wrapped fetch untouched when the timeout is disabled', () => {
    const baseFetch = vi.fn();

    expect(withTimeout(baseFetch, 0)).toBe(baseFetch);
  });

  test('clears its timer so a resolved request holds nothing open', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const baseFetch = vi.fn().mockResolvedValue(response);

    await withTimeout(baseFetch, 1000)('https://rpc.test', {});

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  test('does not rewrite an error that is not its own timeout', async () => {
    const baseFetch = vi.fn().mockRejectedValue(new Error('network down'));

    await expect(
      withTimeout(baseFetch, 1000)('https://rpc.test', {})
    ).rejects.toThrow('network down');
  });

  // A fetch that settles only on an abort of the signal it was handed, up front
  // or later, as a real fetch does. These fail if the caller's signal is
  // dropped instead of composed.
  const signalRespectingFetch = () =>
    vi.fn((_url: any, init: RequestInit = {}) => {
      const { signal } = init;
      return new Promise<Response>((_resolve, reject) => {
        if (signal?.aborted) return reject(signal.reason);
        signal?.addEventListener('abort', () => reject(signal.reason));
      });
    });

  test('rejects on a caller abort with the caller reason, not a timeout', async () => {
    const caller = new AbortController();
    const reason = new Error('caller gave up');
    const request = withTimeout(signalRespectingFetch(), 30000)(
      'https://rpc.test',
      { signal: caller.signal }
    );

    caller.abort(reason);

    await expect(request).rejects.toBe(reason);
  });

  test('aborts at once when the caller signal is already aborted', async () => {
    const caller = new AbortController();
    const reason = new Error('caller gave up first');
    caller.abort(reason);

    await expect(
      withTimeout(signalRespectingFetch(), 30000)('https://rpc.test', {
        signal: caller.signal
      })
    ).rejects.toBe(reason);
  });

  test('stops listening on the caller signal once the request settles', async () => {
    const caller = new AbortController();
    const removeEventListener = vi.spyOn(caller.signal, 'removeEventListener');
    const baseFetch = vi.fn().mockResolvedValue(response);

    await withTimeout(baseFetch, 1000)('https://rpc.test', {
      signal: caller.signal
    });

    expect(removeEventListener).toHaveBeenCalledWith(
      'abort',
      expect.any(Function)
    );
  });
});
