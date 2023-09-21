import { test, expect, describe } from 'vitest';
import { getSnapshots } from '../../../src/utils/blockfinder';
import getProvider from '../../../src/utils/provider';

describe('Test block finder', () => {
  const provider = getProvider('1');

  test('getSnapshots should work without errors and return object', async () => {
    expect(
      await getSnapshots('1', 17789783, provider, ['5', '137'])
    ).toMatchObject({
      '1': 17789783,
      '137': 45609596,
      '5': 9421169
    });
  });

  test('getSnapshots should return all latest if snapshot is latest', async () => {
    expect(
      await getSnapshots('1', 'latest', provider, ['5', '137'])
    ).toMatchObject({
      '137': 'latest',
      '5': 'latest'
    });
  });

  test('getSnapshots should throw on network error', async () => {
    await expect(
      getSnapshots('1', 17780783, provider, ['5', '137'], {
        blockFinderUrl: 'http://localhost:12345'
      })
    ).to.rejects.toEqual({
      code: 0,
      message:
        'FetchError: [POST] "http://localhost:12345": <no response> request to http://localhost:12345/ failed, reason: connect ECONNREFUSED 127.0.0.1:12345',
      data: ''
    });
  });

  test('getSnapshots should throw on subgraph error', async () => {
    await expect(
      getSnapshots('1', 17780783, provider, ['1234455'], {
        blockFinderUrl: 'http://google.com'
      })
    ).to.rejects.toEqual(
      expect.objectContaining({
        code: 405,
        message: 'Method Not Allowed'
      })
    );
  });
});
