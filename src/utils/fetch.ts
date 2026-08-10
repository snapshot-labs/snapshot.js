export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export interface WithTimeoutOptions {
  // For callers whose stack constrains the error type, e.g. starknet's
  // RpcChannel. The default is a plain `Error`.
  timeoutError?: (timeout: number) => Error;
}

const defaultTimeoutError = (timeout: number) =>
  new Error(`Request timeout after ${timeout}ms`);

// Every body reader a `Response` may carry, patched only where it exists:
// node-fetch 2 ships no `formData`, and a hand-rolled test double has only
// the reader it needs.
const BODY_READERS = ['json', 'text', 'arrayBuffer', 'blob', 'formData'];

// Not `AbortSignal.timeout`: it would raise the browser bundle's floor to
// Safari 16.
export function withTimeout(
  fetchFn: FetchLike,
  timeout: number,
  { timeoutError = defaultTimeoutError }: WithTimeoutOptions = {}
): FetchLike {
  // A precondition of the primitive, not a live path: the only caller in this
  // repo gates the install above 0. Without it, `setTimeout(..., 0)` would
  // abort every request on the next tick.
  if (timeout <= 0) return fetchFn;

  return async (url, init) => {
    const controller = new AbortController();
    const callerSignal = init?.signal;
    const abortFromCaller = () => controller.abort(callerSignal?.reason);
    let timedOut = false;

    const cleanup = () => {
      clearTimeout(timer);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    };
    // Cleans up after itself: nothing else will if the body is never read.
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      cleanup();
    }, timeout);
    // Node-only: browser timers are numbers with no `unref`. Without this,
    // an unread response body holds the event loop open for the full
    // timeout even though the request already finished.
    if (typeof timer === 'object' && 'unref' in timer) timer.unref();

    if (callerSignal?.aborted) abortFromCaller();
    else callerSignal?.addEventListener('abort', abortFromCaller);

    let response: Response;
    try {
      response = await fetchFn(url, { ...init, signal: controller.signal });
    } catch (e) {
      cleanup();
      throw timedOut ? timeoutError(timeout) : e;
    }

    // Resolving only means the headers arrived: the body stream and the parse
    // that follow are bounded by nothing. Hold the deadline over whichever
    // reader the caller picks, so the deadline covers all of them and each one
    // reports it the same way. Reading `response.body` as a stream is the one
    // path this cannot reach; that still surfaces the raw abort.
    const readers = response as unknown as Record<
      string,
      undefined | (() => Promise<unknown>)
    >;
    for (const name of BODY_READERS) {
      const read = readers[name];
      if (typeof read !== 'function') continue;

      const bound = read.bind(response);
      readers[name] = async () => {
        try {
          return await bound();
        } catch (e) {
          throw timedOut ? timeoutError(timeout) : e;
        } finally {
          cleanup();
        }
      };
    }

    return response;
  };
}
