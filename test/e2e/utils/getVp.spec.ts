import { test, expect, describe } from 'vitest';
import { getVp } from '../../../src/utils';

describe('test getVp', () => {
  test('getVp should return a promise rejection on error from score-api', async () => {
    expect.assertions(1);
    await expect(
      getVp(
        '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
        '1',
        [
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
        7929876,
        'test.eth',
        false
      )
    ).to.rejects.toHaveProperty('code');
  });

  test('getVp should return a promise rejection with JSON-RPC format on network error', async () => {
    expect.assertions(1);
    await expect(
      getVp(
        '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
        '1',
        [
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
        7929876,
        'test.eth',
        false,
        { url: 'https://score-null.snapshot.org' }
      )
    ).to.rejects.toEqual({
      code: 'ECONNRESET',
      message:
        'FetchError: request to https://score-null.snapshot.org/ failed, reason: read ECONNRESET',
      data: ''
    });
  });
});
