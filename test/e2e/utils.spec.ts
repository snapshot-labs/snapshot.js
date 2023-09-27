import { test, expect, describe } from 'vitest';
import { getScores, getVp, validate, getJSON, ipfsGet } from '../../src/utils';

describe('getScores', () => {
  test('should return a score', async () => {
    expect.assertions(1);
    expect(
      await getScores(
        'fabien.eth',
        [
          {
            name: 'eth-balance',
            network: '1',
            params: {}
          }
        ],
        '1',
        ['0xeF8305E140ac520225DAf050e2f71d5fBcC543e7']
      )
    ).toEqual([
      {
        '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7': 0.041582733391515345
      }
    ]);
  }, 20e3);

  test('should return a promise rejection on error from score-api', async () => {
    expect.assertions(1);
    await expect(getScores('test.eth', [], '1', ['0x0'])).to.rejects.toEqual({
      code: 500,
      message: 'unauthorized',
      data: 'something wrong with the strategies'
    });
  });

  test('should return a promise rejection with JSON-RPC format on network error (no response)', async () => {
    expect.assertions(1);
    await expect(
      getScores(
        'test.eth',
        [],
        '1',
        [''],
        'latest',
        'https://score-null.snapshot.org'
      )
    ).to.rejects.toEqual({
      code: 0,
      message:
        'FetchError: [POST] "https://score-null.snapshot.org/api/scores": <no response> request to https://score-null.snapshot.org/api/scores failed, reason: getaddrinfo ENOTFOUND score-null.snapshot.org',
      data: ''
    });

    test.todo('should handle missing headers in options', () => {});
    test.todo('should handle additional headers provided in options', () => {});
    test.todo('should properly handle timeout', () => {});
  });

  test('should return a promise rejection with JSON-RPC format on network error (not found)', async () => {
    expect.assertions(1);
    await expect(
      getScores('test.eth', [], '1', [''], 'latest', 'https://hub.snapshot.org')
    ).to.rejects.toEqual(
      expect.objectContaining({
        code: 404
      })
    );
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

  test('should return a voting power', async () => {
    expect.assertions(1);
    expect(await getVp(...defaultOptions)).toEqual({
      vp: 10.49214268914954,
      vp_by_strategy: [10.443718706159482, 0.04842398299005922],
      vp_state: 'final'
    });
  });

  test('should return a promise rejection on error from score-api', async () => {
    expect.assertions(1);
    await expect(
      getVp('test', network, strategies, s, space, delegation)
    ).to.rejects.toEqual({
      code: 400,
      message: 'unauthorized',
      data: 'invalid address'
    });
  });

  test('should return a promise rejection with JSON-RPC format on network error (no response)', async () => {
    expect.assertions(1);
    await expect(
      getVp(...defaultOptions, {
        url: 'https://score-null.snapshot.org'
      })
    ).to.rejects.toEqual({
      code: 0,
      message:
        'FetchError: [POST] "https://score-null.snapshot.org": <no response> request to https://score-null.snapshot.org/ failed, reason: getaddrinfo ENOTFOUND score-null.snapshot.org',
      data: ''
    });
  });

  test('should return a promise rejection with JSON-RPC format on network error (not found)', async () => {
    expect.assertions(1);
    await expect(
      getVp(...defaultOptions, {
        url: 'https://httpstat.us/405'
      })
    ).to.rejects.toEqual(
      expect.objectContaining({
        code: 405,
        message: 'Method Not Allowed'
      })
    );
  });

  test.todo('should handle invalid network parameter', () => {});
  test.todo('should handle missing headers in options', () => {});
  test.todo('should handle additional headers provided in options', () => {});
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

  test('should return a boolean', async () => {
    expect.assertions(1);
    expect(
      await validate(validation, author, space, network, 'latest', params)
    ).toEqual(false);
  });

  test('should return a promise rejection on error from score-api', async () => {
    expect.assertions(1);
    await expect(
      validate(validation, 'test', space, network, 'latest', params)
    ).to.rejects.toEqual({
      code: 400,
      message: 'unauthorized',
      data: 'invalid address'
    });
  });

  test('should return a promise rejection with JSON-RPC format on network error (no response)', async () => {
    expect.assertions(1);
    await expect(
      validate(...defaultOptions, {
        url: 'https://score-null.snapshot.org'
      })
    ).to.rejects.toEqual({
      code: 0,
      message:
        'FetchError: [POST] "https://score-null.snapshot.org": <no response> request to https://score-null.snapshot.org/ failed, reason: getaddrinfo ENOTFOUND score-null.snapshot.org',
      data: ''
    });
  });

  test('should return a promise rejection with JSON-RPC format on network error (not found)', async () => {
    expect.assertions(1);
    await expect(
      validate(...defaultOptions, {
        url: 'https://httpstat.us/405'
      })
    ).to.rejects.toEqual(
      expect.objectContaining({
        code: 405,
        message: 'Method Not Allowed'
      })
    );
  });
});

describe('getJSON', () => {
  test('should return a JSON', async () => {
    expect.assertions(1);
    expect(await getJSON('https://hub.snapshot.org')).toEqual(
      expect.objectContaining({ name: 'snapshot-hub' })
    );
  });

  test('should throw an error when the response is not a JSON file', async () => {
    expect.assertions(1);
    await expect(() => getJSON('https://snapshot.org')).rejects.toThrowError(
      /Unexpected.*JSON/
    );
  });

  test('should throw an error on network error (no response)', async () => {
    expect.assertions(1);
    await expect(() =>
      getJSON('https://score-null.snapshot.org')
    ).rejects.toThrowError('ENOTFOUND');
  });

  test('should throw an error on network error (not found)', async () => {
    expect.assertions(1);
    await expect(() => getJSON('https://httpstat.us/405')).rejects.toThrowError(
      '405 Method Not Allowed'
    );
  });
});

describe('ipfsGet', () => {
  const cid = 'bafkreibatgmdqdxsair3j52zfhtntegshtypq2qbex3fgtorwx34kzippe';

  test('should return a JSON', async () => {
    expect.assertions(1);
    expect(await ipfsGet('pineapple.fyi', cid)).toEqual({ name: 'Vitalik' });
  });

  test('should throw an error on network error (no response)', async () => {
    expect.assertions(1);
    await expect(() =>
      ipfsGet('score-null.snapshot.org', cid)
    ).rejects.toThrowError('ENOTFOUND');
  });

  test('should throw an error on network error (not found)', async () => {
    expect.assertions(1);
    await expect(() => ipfsGet('httpstat.us/404', cid)).rejects.toThrowError(
      '404 Not Found'
    );
  });
});
