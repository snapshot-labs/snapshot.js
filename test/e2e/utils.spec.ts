import { test, expect, describe } from 'vitest';
import { getScores, getVp, validate } from '../../src/utils';

describe('test getScores', () => {
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
  });

  test('should return a promise rejection with JSON-RPC format on network error (not found)', async () => {
    expect.assertions(1);
    await expect(
      getScores('test.eth', [], '1', [''], 'latest', 'https://google.com')
    ).to.rejects.toEqual(
      expect.objectContaining({
        code: 404
      })
    );
  });
});

describe('test getVp', () => {
  const defaultOptions = ['0x0', '1', [], 'latest', 'test.eth', false];

  test('should return a promise rejection on error from score-api', async () => {
    expect.assertions(1);
    await expect(getVp(...defaultOptions)).to.rejects.toEqual({
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
        url: 'https://google.com'
      })
    ).to.rejects.toEqual(
      expect.objectContaining({
        code: 405,
        message: 'Method Not Allowed'
      })
    );
  });
});

describe('test validate', () => {
  const defaultOptions = ['', '', 'test.eth', '1', 'latest', {}];

  test('should return a promise rejection on error from score-api', async () => {
    expect.assertions(1);
    await expect(validate(...defaultOptions)).to.rejects.toEqual({
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
        url: 'https://google.com'
      })
    ).to.rejects.toEqual(
      expect.objectContaining({
        code: 405,
        message: 'Method Not Allowed'
      })
    );
  });
});
