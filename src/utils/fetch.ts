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

// Not `AbortSignal.timeout`: it would raise the browser bundle's floor to
// Safari 16.
export function withTimeout(
  fetchFn: FetchLike,
  timeout: number,
  { timeoutError = defaultTimeoutError }: WithTimeoutOptions = {}
): FetchLike {
  // Without this, `setTimeout(..., 0)` aborts every request on the next tick.
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

    // Resolving only means the headers arrived: a caller reading the body
    // afterwards with its own `.json()` gets no bound from node-fetch on the
    // body stream or the parse. Hold the deadline until that settles.
    const json = response.json.bind(response);
    response.json = async () => {
      try {
        return await json();
      } catch (e) {
        throw timedOut ? timeoutError(timeout) : e;
      } finally {
        cleanup();
      }
    };

    return response;
  };
}
