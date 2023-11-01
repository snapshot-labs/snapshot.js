import { describe, test, expect, vi, afterEach } from 'vitest';
import * as crossFetch from 'cross-fetch';
import { validate } from './utils';

vi.mock('cross-fetch', async () => {
  const actual = await vi.importActual('cross-fetch');

  return {
    ...actual,
    default: vi.fn()
  };
});
const fetch = vi.mocked(crossFetch.default);

describe('utils', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validate', () => {
    const payload = {
      validation: 'basic',
      author: '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
      space: 'fabien.eth',
      network: '1',
      snapshot: 7929876,
      params: {
        minScore: 0.9,
        strategies: [
          {
            name: 'eth-balance',
            params: {}
          }
        ]
      }
    };

    function _validate({
      validation,
      author,
      space,
      network,
      snapshot,
      params,
      options
    }) {
      return validate(
        validation ?? payload.validation,
        author ?? payload.author,
        space ?? payload.space,
        network ?? payload.network,
        snapshot ?? payload.snapshot,
        params ?? payload.params,
        options ?? {}
      );
    }

    describe('when passing invalid args', () => {
      const cases = [
        [
          'author is an invalid address',
          { author: 'test-address' },
          /invalid author/i
        ],
        ['network is not valid', { network: 'mainnet' }, /invalid network/i],
        ['network is empty', { network: '' }, /invalid network/i],
        [
          'snapshot is smaller than start block',
          { snapshot: 1234 },
          /snapshot \([0-9]+\) must be greater than network start block/i
        ]
      ];

      test.each(cases)('throw an error when %s', async (title, args, err) => {
        await expect(_validate(args)).rejects.toMatch(err);
      });
    });

    describe('when passing valid args', () => {
      test('send a JSON-RPC payload to score-api', async () => {
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve({ result: 'OK' }))
        });

        expect(_validate({})).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://score.snapshot.org',
          expect.objectContaining({
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'validate',
              params: payload
            })
          })
        );
      });

      test('send a POST request with JSON content-type', async () => {
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve({ result: 'OK' }))
        });

        expect(_validate({})).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://score.snapshot.org',
          expect.objectContaining({
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          })
        );
      });

      test('can customize the score-api url', () => {
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve({ result: 'OK' }))
        });

        expect(
          _validate({ options: { url: 'https://snapshot.org/?apiKey=xxx' } })
        ).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://snapshot.org/?apiKey=xxx',
          expect.anything()
        );
      });

      test('returns the JSON-RPC result property', () => {
        const result = { result: 'OK' };
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve(result))
        });

        expect(_validate({})).resolves.toEqual('OK');
      });
    });

    describe('when score-api is sending a JSON-RPC error', () => {
      test('rejects with the JSON-RPC error object', () => {
        const result = { error: { message: 'Oh no' } };
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve(result))
        });

        expect(_validate({})).rejects.toEqual(result.error);
      });
    });

    describe('when the fetch request is failing with not network error', () => {
      test('rejects with the error', () => {
        const result = new Error('Oh no');
        fetch.mockReturnValue({
          json: () => {
            throw result;
          }
        });

        expect(_validate({})).rejects.toEqual(result);
      });
    });
  });
});
