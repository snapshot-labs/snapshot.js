import { test, expect, describe } from 'vitest';
import { getScores } from '../../../src/utils';

describe('test getScores', () => {
  test('getScores should return a promise rejection on error from score-api', async () => {
    expect.assertions(1);
    await expect(
      getScores('test.eth', [], '1', [
        '0x9e8f6CF284Db7a80646D9d322A37b3dAF461F8DD'
      ])
    ).to.rejects.toHaveProperty('code');
  });

  test('getScores should return a promise rejection with JSON-RPC format on network error', async () => {
    expect.assertions(1);
    await expect(
      getScores(
        'test.eth',
        [],
        '1',
        ['0x9e8f6CF284Db7a80646D9d322A37b3dAF461F8DD'],
        'latest',
        'https://score-null.snapshot.org'
      )
    ).to.rejects.toEqual({
      code: 'ENOTFOUND',
      message:
        'FetchError: request to https://score-null.snapshot.org/api/scores failed, reason: getaddrinfo ENOTFOUND score-null.snapshot.org',
      data: ''
    });
  });

  test('getScores should return a promise rejection with JSON-RPC format on network error', async () => {
    expect.assertions(1);
    await expect(
      getScores(
        'test.eth',
        [],
        '1',
        ['0x9e8f6CF284Db7a80646D9d322A37b3dAF461F8DD'],
        'latest',
        'https://snapshot.org'
      )
    ).to.rejects.toEqual({
      code: 405,
      message: 'Method Not Allowed',
      data: ''
    });
  });
});
