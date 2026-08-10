import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { AddressInfo, createServer, Server, Socket } from 'net';
import getProvider, {
  DEFAULT_TIMEOUT,
  normalizeOptions
} from '../../../src/utils/provider';
import { getViemClient } from '../../../src/utils/viem';
import { LibraryError, RpcProvider } from 'starknet';

const STARKNET_NETWORK = '0x534e5f4d41494e';

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
  // Not a refused connection: that one fails fast on its own.
  let server: Server;
  // A proxy that wedges after it has relayed the upstream headers.
  let headersOnlyServer: Server;
  let sockets: Socket[] = [];
  let broviderUrl: string;
  let headersOnlyUrl: string;

  const listen = async (server: Server): Promise<string> => {
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', () => resolve())
    );
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  };

  beforeAll(async () => {
    // The deadline aborts mid-request, so an RST is expected; an unhandled
    // 'error' on a socket takes the worker down rather than failing a test.
    const accept = (socket: Socket) => {
      socket.on('error', () => {
        /* expected */
      });
      sockets.push(socket);
      return socket;
    };

    server = createServer(accept);
    headersOnlyServer = createServer((socket) => {
      accept(socket).on('data', () =>
        socket.write(
          'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 24\r\n\r\n'
        )
      );
    });
    broviderUrl = await listen(server);
    headersOnlyUrl = await listen(headersOnlyServer);
  });

  afterAll(async () => {
    sockets.forEach((socket) => socket.destroy());
    sockets = [];
    await Promise.all(
      [server, headersOnlyServer].map(
        (s) => new Promise<void>((resolve) => s.close(() => resolve()))
      )
    );
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

  test('rejects when the body stalls after the headers arrive', async () => {
    const provider = getProvider(STARKNET_NETWORK, {
      broviderUrl: headersOnlyUrl,
      timeout: 300
    });
    const start = Date.now();

    await expect(provider.getSpecVersion()).rejects.toMatchObject({
      message: 'Request timeout after 300ms',
      code: 'TIMEOUT'
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(300);
    expect(elapsed).toBeLessThan(3000);
  });

  test('leaves starknet its own transport when the timeout is disabled', () => {
    const provider = getProvider(STARKNET_NETWORK, { broviderUrl, timeout: 0 });
    const stock = new RpcProvider({ nodeUrl: broviderUrl }) as any;

    expect(provider.channel.baseFetch).toBe(stock.channel.baseFetch);
  });

  // cross-fetch's Node entry is node-fetch 2, which sets `Connection: close`
  // whenever no agent is passed, so it reuses no connection to the brovider.
  test('does not close the connection after every request', async () => {
    const requests: string[] = [];
    const open: Socket[] = [];
    const rpcServer = createServer((socket) => {
      open.push(socket);
      socket.on('data', (chunk) => {
        requests.push(chunk.toString());
        const body = '{"jsonrpc":"2.0","id":1,"result":"0.8.1"}';
        socket.write(
          'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n' +
            `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`
        );
      });
    });
    const rpcUrl = await listen(rpcServer);

    try {
      const provider = getProvider(STARKNET_NETWORK, {
        broviderUrl: rpcUrl,
        timeout: 1000
      });

      await expect(provider.getSpecVersion()).resolves.toBe('0.8.1');
      expect(requests.join('')).not.toMatch(/^connection:\s*close/im);
    } finally {
      open.forEach((socket) => socket.destroy());
      await new Promise<void>((resolve) => rpcServer.close(() => resolve()));
    }
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

  // A plain Error would come back out of RpcChannel#errorHandler stripped of
  // `code`, so the class is what keeps the assertion above true.
  test('rejects with a LibraryError, the only class that keeps the code', async () => {
    const provider = getProvider(STARKNET_NETWORK, {
      broviderUrl,
      timeout: 400
    });

    await expect(provider.getSpecVersion()).rejects.toBeInstanceOf(
      LibraryError
    );
  });

  test('applies the default timeout when none is passed', async () => {
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

describe('normalizeOptions()', () => {
  test.each([
    [undefined, DEFAULT_TIMEOUT],
    [NaN, DEFAULT_TIMEOUT],
    [Infinity, DEFAULT_TIMEOUT],
    [-100, DEFAULT_TIMEOUT],
    [0, 0],
    [30000, 30000],
    // Above this Node clamps the setTimeout delay to ~1ms.
    [2_147_483_648, 2_147_483_647],
    [3e9, 2_147_483_647]
  ])('normalizes a timeout of %s to %s', (timeout, expected) => {
    expect(normalizeOptions({ timeout }).timeout).toBe(expected);
  });
});
