import { test, expect, describe } from 'vitest';
import { getScores } from '../../../src/utils';

describe('test getScores', () => {
  test('getScores should return a promise rejection on error from score-api', async () => {
    expect.assertions(1);
    await expect(
      getScores('test.eth', [], '1', ['0x0'])
    ).to.rejects.toHaveProperty('code');
  });

  test('getScores should return a promise rejection with JSON-RPC format on network error', async () => {
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
      code: 'ENOTFOUND',
      message:
        'FetchError: request to https://score-null.snapshot.org/api/scores failed, reason: getaddrinfo ENOTFOUND score-null.snapshot.org',
      data: ''
    });
  });
});
