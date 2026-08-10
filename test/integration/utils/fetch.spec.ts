import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { AddressInfo, createServer, Server, Socket } from 'net';
import { withTimeout } from '../../../src/utils/fetch';

describe('withTimeout()', () => {
  // A fresh one per test: the deadline clears when the body is read, so these
  // tests consume it.
  const jsonResponse = () => new Response('{}');

  const signalRespectingFetch = () =>
    vi.fn((_url: any, init: RequestInit = {}) => {
      const { signal } = init;
      return new Promise<Response>((_resolve, reject) => {
        if (signal?.aborted) return reject(signal.reason);
        signal?.addEventListener('abort', () => reject(signal.reason));
      });
    });

  // Stands in for a real transport, whose body stream errors on the abort.
  const stallingBodyFetch = (readers = ['json']) =>
    vi.fn((_url: any, init: RequestInit = {}) => {
      const stall = () =>
        new Promise((_resolve, reject) =>
          init.signal?.addEventListener('abort', () =>
            reject(init.signal?.reason)
          )
        );
      return Promise.resolve(
        Object.fromEntries(
          readers.map((name) => [name, stall])
        ) as unknown as Response
      );
    });

  test('calls the wrapped fetch and preserves its init', async () => {
    const response = jsonResponse();
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
    expect(withTimeout(baseFetch, -1)).toBe(baseFetch);
  });

  test('clears its timer so a read request holds nothing open', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const baseFetch = vi.fn().mockResolvedValue(jsonResponse());

    const response = await withTimeout(baseFetch, 1000)('https://rpc.test', {});
    expect(clearTimeoutSpy).not.toHaveBeenCalled();
    await response.json();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  test('unrefs its timer so an unread body holds nothing open', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const baseFetch = vi.fn().mockResolvedValue(jsonResponse());

    // Resolve the response and never read the body: cleanup() cannot run.
    await withTimeout(baseFetch, 1000)('https://rpc.test', {});

    expect(setTimeoutSpy.mock.results[0].value.hasRef()).toBe(false);
    setTimeoutSpy.mockRestore();
  });

  test('rejects with a timeout error when the headers never arrive', async () => {
    await expect(
      withTimeout(signalRespectingFetch(), 50)('https://rpc.test', {})
    ).rejects.toThrow('Request timeout after 50ms');
  });

  test('maps a timeout during the body read, not just the headers', async () => {
    const response = await withTimeout(stallingBodyFetch(), 50)(
      'https://rpc.test',
      {}
    );

    await expect(response.json()).rejects.toThrow('Request timeout after 50ms');
  });

  test('builds the timeout error with the supplied factory', async () => {
    const timeoutError = vi.fn(
      (timeout: number) => new Error(`gone ${timeout}`)
    );

    await expect(
      withTimeout(signalRespectingFetch(), 50, { timeoutError })(
        'https://rpc.test',
        {}
      )
    ).rejects.toThrow('gone 50');
    expect(timeoutError).toHaveBeenCalledWith(50);
  });

  test('uses the supplied factory on the body read too', async () => {
    const timeoutError = () =>
      Object.assign(new Error('gone'), { code: 'TIMEOUT' });
    const response = await withTimeout(stallingBodyFetch(), 50, {
      timeoutError
    })('https://rpc.test', {});

    await expect(response.json()).rejects.toMatchObject({
      message: 'gone',
      code: 'TIMEOUT'
    });
  });

  // The primitive advertises a plain `FetchLike`, so a caller is free to read
  // the body with any of these; the deadline and the error have to be the same
  // whichever one it picks.
  test.each(['json', 'text', 'arrayBuffer', 'blob', 'formData'])(
    'maps the timeout for a caller reading the body with .%s()',
    async (reader) => {
      const timeoutError = () =>
        Object.assign(new Error('gone'), { code: 'TIMEOUT' });
      const response = await withTimeout(stallingBodyFetch([reader]), 50, {
        timeoutError
      })('https://rpc.test', {});

      await expect((response as any)[reader]()).rejects.toMatchObject({
        message: 'gone',
        code: 'TIMEOUT'
      });
    }
  );

  test('clears its timer for a caller reading the body with .text()', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const baseFetch = vi.fn().mockResolvedValue(new Response('hello'));

    const response = await withTimeout(baseFetch, 1000)('https://rpc.test', {});
    expect(clearTimeoutSpy).not.toHaveBeenCalled();
    await response.text();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  test('does not rewrite an error that is not its own timeout', async () => {
    const baseFetch = vi.fn().mockRejectedValue(new Error('network down'));

    await expect(
      withTimeout(baseFetch, 1000)('https://rpc.test', {})
    ).rejects.toThrow('network down');
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

  test('unhooks the caller signal when the deadline fires on an unread body', async () => {
    const caller = new AbortController();
    const removeEventListener = vi.spyOn(caller.signal, 'removeEventListener');

    await withTimeout(stallingBodyFetch(), 20)('https://rpc.test', {
      signal: caller.signal
    });
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(removeEventListener).toHaveBeenCalledWith(
      'abort',
      expect.any(Function)
    );
  });

  test('stops listening on the caller signal once the request settles', async () => {
    const caller = new AbortController();
    const removeEventListener = vi.spyOn(caller.signal, 'removeEventListener');
    const baseFetch = vi.fn().mockResolvedValue(jsonResponse());

    const response = await withTimeout(baseFetch, 1000)('https://rpc.test', {
      signal: caller.signal
    });
    await response.json();

    expect(removeEventListener).toHaveBeenCalledWith(
      'abort',
      expect.any(Function)
    );
  });
});

describe('withTimeout() over a real socket', () => {
  // Accepts the connection and never answers; a refused connection would fail
  // fast on its own.
  let server: Server;
  let sockets: Socket[] = [];
  let url: string;

  beforeAll(async () => {
    server = createServer((socket) => sockets.push(socket));
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', () => resolve())
    );
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    sockets.forEach((socket) => socket.destroy());
    sockets = [];
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('rejects a hung request instead of waiting on the runtime', async () => {
    const start = Date.now();

    await expect(
      withTimeout(fetch.bind(globalThis), 300)(url, {
        method: 'POST',
        body: '{}'
      })
    ).rejects.toThrow('Request timeout after 300ms');

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(300);
    expect(elapsed).toBeLessThan(3000);
  });

  test('lets a caller abort cancel a hung request before the timeout', async () => {
    const caller = new AbortController();
    const start = Date.now();
    const request = withTimeout(fetch.bind(globalThis), 5000)(url, {
      method: 'POST',
      body: '{}',
      signal: caller.signal
    });
    setTimeout(() => caller.abort(), 50);

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
