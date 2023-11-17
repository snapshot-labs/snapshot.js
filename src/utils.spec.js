import { describe, test, expect, vi, afterEach } from 'vitest';
import * as crossFetch from 'cross-fetch';
import { validate, getScores, getVp } from './utils';

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
          /snapshot \([0-9]+\) must be 'latest' or greater than network start block/i
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
  describe('getScores', () => {
    const payload = {
      space: 'test.eth',
      network: '1',
      snapshot: 7929876,
      strategies: [
        {
          name: 'erc20-balance-of',
          params: {
            symbol: 'TEST',
            address: '0xc23F41519D7DFaDf9eed53c00f08C06CD5cDde54',
            network: '1',
            decimals: 18
          },
          network: '1'
        }
      ],
      addresses: ['0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11']
    };

    function _getScores({
      space,
      strategies,
      network,
      addresses,
      snapshot,
      scoreApiUrl,
      options
    }) {
      return getScores(
        space ?? payload.space,
        strategies ?? payload.strategies,
        network ?? payload.network,
        addresses ?? payload.addresses,
        snapshot ?? payload.snapshot,
        scoreApiUrl ?? 'https://score.snapshot.org',
        options ?? {}
      );
    }

    describe('when passing invalid args', () => {
      const cases = [
        [
          'addresses contains invalid address',
          { addresses: ['test-address'] },
          /invalid address/i
        ],
        [
          'addresses is not an array',
          { addresses: 'test-address' },
          /addresses should be an array/i
        ],
        [
          'addresses is an empty array',
          { addresses: [] },
          /addresses can not be empty/i
        ],
        ['network is not valid', { network: 'mainnet' }, /invalid network/i],
        ['network is empty', { network: '' }, /invalid network/i],
        [
          'snapshot is smaller than start block',
          { snapshot: 1234 },
          /snapshot \([0-9]+\) must be 'latest' or greater than network start block/i
        ],
        [
          'strategy contains invalid network',
          { strategies: [{ name: '', network: 'test' }] },
          /invalid network \(.*\) in strategy/i
        ]
      ];

      test.each(cases)('throw an error when %s', async (title, args, err) => {
        await expect(_getScores(args)).rejects.toMatch(err);
      });
    });

    describe('when passing valid args', () => {
      test('send a JSON-RPC payload to score-api', async () => {
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve({ result: 'OK' }))
        });

        expect(_getScores({})).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://score.snapshot.org/api/scores',
          expect.objectContaining({
            body: JSON.stringify({ params: payload })
          })
        );
      });

      test('send a POST request with JSON content-type', async () => {
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve({ result: 'OK' }))
        });

        expect(_getScores({})).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://score.snapshot.org/api/scores',
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

        expect(_getScores({ scoreApiUrl: 'https://snapshot.org/?apiKey=xxx' }))
          .resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://snapshot.org/api/scores?apiKey=xxx',
          expect.anything()
        );
      });

      test('returns the JSON-RPC result scores property', () => {
        const result = { scores: 'SCORES', other: 'Other' };
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve({ result }))
        });

        expect(_getScores({})).resolves.toEqual('SCORES');
      });

      test('returns the JSON-RPC all properties', () => {
        const result = { scores: 'SCORES', other: 'Other' };
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve({ result }))
        });

        expect(
          _getScores({ options: { returnValue: 'all' } })
        ).resolves.toEqual(result);
      });
    });

    describe('when score-api is sending a JSON-RPC error', () => {
      test('rejects with the JSON-RPC error object', () => {
        const result = { error: { message: 'Oh no' } };
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve(result))
        });

        expect(_getScores({})).rejects.toEqual(result.error);
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

        expect(_getScores({})).rejects.toEqual(result);
      });
    });
  });
  describe('getVp', () => {
    const payload = {
      address: '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
      network: '1',
      strategies: [
        {
          name: 'erc20-balance-of',
          params: {
            symbol: 'TEST',
            address: '0xc23F41519D7DFaDf9eed53c00f08C06CD5cDde54',
            network: '1',
            decimals: 18
          },
          network: '1'
        }
      ],
      snapshot: 7929876,
      space: 'test.eth',
      delegation: false,
      options: undefined
    };

    function _getVp({ voter, network, strategies, snapshot, options }) {
      return getVp(
        voter ?? payload.address,
        network ?? payload.network,
        strategies ?? payload.strategies,
        snapshot ?? payload.snapshot,
        'test.eth' ?? payload.space,
        false ?? payload.delegation,
        options ?? payload.options
      );
    }

    describe('when passing invalid args', () => {
      const cases = [
        [
          'voter is not a valid address',
          { voter: 'test-address' },
          /invalid voter address/i
        ],
        ['voter is empty', { voter: '' }, /invalid voter address/i],
        ['network is not valid', { network: 'mainnet' }, /invalid network/i],
        ['network is empty', { network: '' }, /invalid network/i],
        [
          'snapshot is smaller than start block',
          { snapshot: 1234 },
          /snapshot \([0-9]+\) must be 'latest' or greater than network start block/i
        ],
        [
          'strategy contains invalid network',
          { strategies: [{ name: '', network: 'test' }] },
          /invalid network \(.*\) in strategy/i
        ]
      ];

      test.each(cases)('throw an error when %s', async (title, args, err) => {
        await expect(_getVp(args)).rejects.toMatch(err);
      });
    });

    describe('when passing valid args', () => {
      test('send a JSON-RPC payload to score-api', async () => {
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve({ result: 'OK' }))
        });

        expect(_getVp({})).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://score.snapshot.org',
          expect.objectContaining({
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'get_vp',
              params: payload
            })
          })
        );
      });

      test('send a POST request with JSON content-type', async () => {
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve({ result: 'OK' }))
        });

        expect(_getVp({})).resolves;
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

        expect(_getVp({ options: { url: 'https://snapshot.org' } })).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://snapshot.org',
          expect.anything()
        );
      });

      test('returns the JSON-RPC result property', () => {
        const result = { data: 'OK' };
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve({ result }))
        });

        expect(_getVp({})).resolves.toEqual(result);
      });
    });

    describe('when score-api is sending a JSON-RPC error', () => {
      test('rejects with the JSON-RPC error object', () => {
        const result = { error: { message: 'Oh no' } };
        fetch.mockReturnValue({
          json: () => new Promise((resolve) => resolve(result))
        });

        expect(_getVp({})).rejects.toEqual(result.error);
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

        expect(_getVp({})).rejects.toEqual(result);
      });
    });
  });
});
