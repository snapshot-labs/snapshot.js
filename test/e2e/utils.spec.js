import { test, expect, describe } from 'vitest';
import {
  getScores,
  getVp,
  validate,
  getJSON,
  ipfsGet,
  subgraphRequest
} from '../../src/utils';

const SCORE_API_URL = 'https://score.snapshot.org';

describe('getScores', () => {
  const payload = [
    'fabien.eth',
    [
      {
        name: 'eth-balance',
        network: '1',
        params: {}
      }
    ],
    '1',
    ['0xeF8305E140ac520225DAf050e2f71d5fBcC543e7'],
    'latest'
  ];

  describe('on success', () => {
    const scoresResponse = [
      {
        '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7': 0.041582733391515345
      }
    ];
    const stateResponse = 'pending';

    test('should return only the scores property by default', async () => {
      expect.assertions(1);
      expect(await getScores(...payload)).toEqual(scoresResponse);
    });

    test('should return the full scores object', async () => {
      expect.assertions(1);
      expect(
        await getScores(...payload, SCORE_API_URL, {
          returnValue: 'all'
        })
      ).toEqual({
        scores: scoresResponse,
        state: stateResponse
      });
    });

    test('should return only the given field', async () => {
      expect.assertions(1);
      expect(
        await getScores(...payload, SCORE_API_URL, {
          returnValue: 'state'
        })
      ).toEqual(stateResponse);
    });

    test('should return undefined when the given field does not exist', async () => {
      expect.assertions(1);
      expect(
        await getScores(...payload, SCORE_API_URL, {
          returnValue: 'test'
        })
      ).toEqual(undefined);
    });
  });

  describe('on error', () => {
    test('should return the JSON-RPC error from score-api', () => {
      expect.assertions(1);
      expect(getScores('test.eth', [], '1', ['0x0'])).rejects.toEqual({
        code: 500,
        message: 'unauthorized',
        data: 'something wrong with the strategies'
      });
    });

    test('should return a JSON-RPC-like error on network error (no response)', () => {
      expect.assertions(1);
      expect(
        getScores(...payload, 'https://score-null.snapshot.org')
      ).rejects.toEqual({
        code: 0,
        message:
          'FetchError: [POST] "https://score-null.snapshot.org/api/scores": <no response> request to https://score-null.snapshot.org/api/scores failed, reason: getaddrinfo ENOTFOUND score-null.snapshot.org',
        data: ''
      });
    });

    test('should return a JSON-RPC-like error on network error (not found)', () => {
      expect.assertions(1);
      expect(
        getScores(...payload, 'https://httpstat.us', { pathname: '404' })
      ).rejects.toEqual(
        expect.objectContaining({
          code: 404,
          message: 'Not Found'
        })
      );
    });

    test('should return a JSON-RPC-like error on network error (timeout)', () => {
      expect.assertions(1);
      expect(
        getScores(...payload, 'https://httpstat.us/?sleep=5000', {
          timeout: 500,
          pathname: '200'
        })
      ).rejects.toEqual(
        expect.objectContaining({
          code: 0,
          message:
            'FetchError: [POST] "https://httpstat.us/200?sleep=5000": <no response> The operation was aborted.'
        })
      );
    });
  });
});

describe('getVp', () => {
  const address = '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7';
  const network = '1';
  const strategies = [
    {
      name: 'eth-balance',
      network: '1',
      params: {}
    },
    {
      name: 'eth-balance',
      network: '10',
      params: {}
    }
  ];
  const s = 15109700;
  const space = 'fabien.eth';
  const delegation = false;
  const defaultOptions = [address, network, strategies, s, space, delegation];

  describe('on success', () => {
    test('should return a voting power', async () => {
      expect.assertions(1);
      expect(await getVp(...defaultOptions)).toEqual({
        vp: 10.49214268914954,
        vp_by_strategy: [10.443718706159482, 0.04842398299005922],
        vp_state: 'final'
      });
    });
  });

  describe('on error', () => {
    test('should return a JSON-RPC error from score-api', () => {
      expect.assertions(1);
      expect(
        getVp('test', network, strategies, s, space, delegation)
      ).rejects.toEqual({
        code: 400,
        message: 'unauthorized',
        data: 'invalid address'
      });
    });

    test('should return a JSON-RPC-like error on network error (no response)', () => {
      expect.assertions(1);
      expect(
        getVp(...defaultOptions, {
          url: 'https://score-null.snapshot.org'
        })
      ).rejects.toEqual({
        code: 0,
        message:
          'FetchError: [POST] "https://score-null.snapshot.org": <no response> request to https://score-null.snapshot.org/ failed, reason: getaddrinfo ENOTFOUND score-null.snapshot.org',
        data: ''
      });
    });

    test('should return a JSON-RPC-like error on network error (not found)', () => {
      expect.assertions(1);
      expect(
        getVp(...defaultOptions, {
          url: 'https://httpstat.us/404'
        })
      ).rejects.toEqual(
        expect.objectContaining({
          code: 404,
          message: 'Not Found'
        })
      );
    });

    test('should return a JSON-RPC-like error on network error (timeout)', () => {
      expect.assertions(1);
      expect(
        getVp(...defaultOptions, {
          url: 'https://httpstat.us/200?sleep=5000',
          timeout: 500
        })
      ).rejects.toEqual(
        expect.objectContaining({
          code: 0,
          message:
            'FetchError: [POST] "https://httpstat.us/200?sleep=5000": <no response> The operation was aborted.'
        })
      );
    });
  });
});

describe('validate', () => {
  const validation = 'basic';
  const author = '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7';
  const space = 'fabien.eth';
  const network = '1';
  const params = {
    minScore: 0.9,
    strategies: [
      {
        name: 'eth-balance',
        params: {}
      }
    ]
  };
  const defaultOptions = [validation, author, space, network, 'latest', params];

  describe('on success', () => {
    test('should return a boolean', async () => {
      expect.assertions(1);
      expect(await validate(...defaultOptions)).toEqual(false);
    });
  });

  describe('on error', () => {
    test('should return the JSON-RPC error from score-api', () => {
      expect.assertions(1);
      expect(
        validate(validation, 'test', space, network, 'latest', params)
      ).rejects.toEqual({
        code: 400,
        message: 'unauthorized',
        data: 'invalid address'
      });
    });

    test('should return a JSON-RPC-like error on network error (no response)', () => {
      expect.assertions(1);
      expect(
        validate(...defaultOptions, {
          url: 'https://score-null.snapshot.org'
        })
      ).rejects.toEqual({
        code: 0,
        message:
          'FetchError: [POST] "https://score-null.snapshot.org": <no response> request to https://score-null.snapshot.org/ failed, reason: getaddrinfo ENOTFOUND score-null.snapshot.org',
        data: ''
      });
    });

    test('should return a JSON-RPC-like error on network error (not found)', () => {
      expect.assertions(1);
      expect(
        validate(...defaultOptions, {
          url: 'https://httpstat.us/404'
        })
      ).rejects.toEqual(
        expect.objectContaining({
          code: 404,
          message: 'Not Found'
        })
      );
    });

    test('should return a JSON-RPC-like error on network error (timeout)', () => {
      expect.assertions(1);
      expect(
        validate(...defaultOptions, {
          url: 'https://httpstat.us/200?sleep=5000',
          timeout: 500
        })
      ).rejects.toEqual(
        expect.objectContaining({
          code: 0,
          message:
            'FetchError: [POST] "https://httpstat.us/200?sleep=5000": <no response> The operation was aborted.'
        })
      );
    });
  });
});

describe('getJSON', () => {
  describe('on success', () => {
    test('should return a JSON object from the specified URL', async () => {
      expect.assertions(1);
      expect(await getJSON('https://hub.snapshot.org')).toEqual(
        expect.objectContaining({ name: 'snapshot-hub' })
      );
    });

    test('should return a JSON object from the specified CID', async () => {
      expect.assertions(1);
      expect(
        await getJSON(
          'bafkreib5epjzumf3omr7rth5mtcsz4ugcoh3ut4d46hx5xhwm4b3pqr2vi'
        )
      ).toEqual(expect.objectContaining({ status: 'OK' }));
    });
  });

  describe('on error', () => {
    test('should throw an error when the response is not a JSON file', () => {
      expect.assertions(1);
      expect(() => getJSON('https://snapshot.org')).rejects.toThrowError(
        /Unexpected.*JSON/
      );
    });

    test('should throw an error when the url is an empty string', () => {
      expect.assertions(1);
      expect(() => getJSON('')).rejects.toThrowError(/Invalid URL/);
    });

    test('should throw an error when the given argument is not valid CID', () => {
      expect.assertions(1);
      expect(() => getJSON('test-cid')).rejects.toThrowError(
        '500 Internal Server Error'
      );
    });

    test('should throw an error when the url is not valid', () => {
      expect.assertions(1);
      expect(() => getJSON('https:// testurl.com')).rejects.toThrowError(
        /Invalid URL/
      );
    });

    test('should throw an error on network error (no response)', () => {
      expect.assertions(1);
      expect(() =>
        getJSON('https://score-null.snapshot.org')
      ).rejects.toThrowError('ENOTFOUND');
    });

    test('should throw an error on network error (not found)', () => {
      expect.assertions(1);
      expect(() => getJSON('https://httpstat.us/404')).rejects.toThrowError(
        '404 Not Found'
      );
    });

    test('should throw an error on network error (timeout)', () => {
      expect.assertions(1);
      expect(() =>
        getJSON('https://httpstat.us/200?sleep=5000', { timeout: 500 })
      ).rejects.toThrowError(
        '[GET] "https://httpstat.us/200?sleep=5000": <no response> The operation was aborted.'
      );
    });
  });
});

describe('ipfsGet', () => {
  const cid = 'bafkreibatgmdqdxsair3j52zfhtntegshtypq2qbex3fgtorwx34kzippe';

  describe('on success', () => {
    test('should return a JSON object', async () => {
      expect.assertions(1);
      expect(await ipfsGet('pineapple.fyi', cid)).toEqual({ name: 'Vitalik' });
    });
  });

  describe('on error', () => {
    test('should throw an error when the response is not a JSON file', () => {
      expect.assertions(1);
      expect(() => ipfsGet('snapshot.org', cid)).rejects.toThrowError(
        /Unexpected.*JSON/
      );
    });

    test('should throw an error on network error (no response)', () => {
      expect.assertions(1);
      expect(() =>
        ipfsGet('score-null.snapshot.org', cid)
      ).rejects.toThrowError('ENOTFOUND');
    });

    test('should throw an error on network error (not found)', () => {
      expect.assertions(1);
      expect(() => ipfsGet('httpstat.us/404', cid)).rejects.toThrowError(
        '404 Not Found'
      );
    });

    test('should throw an error on network error (on invalid protocol argument)', () => {
      expect.assertions(1);
      expect(() => ipfsGet('pineapple.fyi', cid, 'test')).rejects.toThrowError(
        '404 Not Found'
      );
    });

    test('should throw an error on network error (timeout)', () => {
      expect.assertions(1);
      expect(() =>
        ipfsGet(
          `httpstat.us/200?sleep=5000&cachebuster=${Date.now()}`,
          cid,
          'ipfs',
          { timeout: 500 }
        )
      ).rejects.toThrowError('aborted');
    });
  });
});

describe('subgraphRequest', () => {
  const query = {
    blocks: {
      __args: {
        where: {
          ts: 1640000000,
          network_in: ['1']
        }
      },
      network: true,
      number: true
    }
  };
  const HOST = 'https://blockfinder.snapshot.org';

  describe('on success', () => {
    test('should return a JSON object', async () => {
      expect.assertions(1);
      expect(await subgraphRequest(HOST, query)).toEqual({
        blocks: [{ network: '1', number: 13841761 }]
      });
    });
  });

  describe('on error', () => {
    const invalidQuery = {
      blocks: {
        __args: {
          where: {
            ts: 1640000000,
            network_in: ['4']
          }
        },
        network: true,
        number: true
      }
    };

    test('should return the error response from subgraph', () => {
      expect.assertions(1);
      expect(subgraphRequest(HOST, invalidQuery)).rejects.toEqual(
        expect.objectContaining({
          errors: [
            expect.objectContaining({
              message: 'invalid network',
              extensions: { code: 'INVALID_NETWORK' }
            })
          ]
        })
      );
    });

    test('should return an errors object on not JSON response', () => {
      expect.assertions(1);
      expect(
        subgraphRequest('https://httpstat.us/200', query, {
          headers: {
            Accept: 'application/xml',
            'Content-Type': 'application/xml'
          }
        })
      ).rejects.toEqual({
        errors: [
          {
            message: 'Body is not a JSON object',
            extensions: { code: 'INVALID_JSON' }
          }
        ]
      });
    });

    test('should return an errors object on network error (no response)', () => {
      expect.assertions(1);
      expect(
        subgraphRequest('https://test-null.snapshot.org', query)
      ).rejects.toEqual({
        errors: [
          {
            extensions: { code: 0 },
            message:
              'FetchError: [POST] "https://test-null.snapshot.org": <no response> request to https://test-null.snapshot.org/ failed, reason: getaddrinfo ENOTFOUND test-null.snapshot.org'
          }
        ]
      });
    });

    test('should return an errors object on network error (not found)', () => {
      expect.assertions(1);
      expect(subgraphRequest('https://httpstat.us/404', query)).rejects.toEqual(
        {
          errors: [
            {
              extensions: { code: 404 },
              message: 'Not Found'
            }
          ]
        }
      );
    });

    test('should return an errors object on network error (timeout)', () => {
      expect.assertions(1);
      expect(
        subgraphRequest('https://httpstat.us/200?sleep=5000', query, {
          timeout: 500
        })
      ).rejects.toEqual({
        errors: [
          {
            extensions: { code: 0 },
            message:
              'FetchError: [POST] "https://httpstat.us/200?sleep=5000": <no response> The operation was aborted.'
          }
        ]
      });
    });
  });
});
