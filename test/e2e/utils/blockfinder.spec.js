import { test, expect, describe } from 'vitest';
import { getSnapshots } from '../../../src/utils/blockfinder';
import getProvider from '../../../src/utils/provider';

describe('Blockfinder', () => {
  const provider = getProvider('1');

  describe('getSnapshot()', () => {
    describe('on success', () => {
      test('should return a list of blocks per network', async () => {
        expect(
          await getSnapshots('1', 17789783, provider, ['5', '137'])
        ).toMatchObject({
          1: 17789783,
          137: 45609596,
          5: 9421169
        });
      });

      test('should return all latest if snapshot is latest', async () => {
        expect(
          await getSnapshots('1', 'latest', provider, ['5', '137'])
        ).toMatchObject({
          137: 'latest',
          5: 'latest'
        });
      });
    });

    describe('on error', () => {
      test('should throw a GraphQL error from blockfinder', async () => {
        await expect(
          getSnapshots('1', 17780783, provider, ['5', '4', '137'])
        ).to.rejects.toEqual({
          errors: [
            {
              message: 'invalid network',
              locations: [
                {
                  line: 1,
                  column: 9
                }
              ],
              path: ['blocks'],
              extensions: {
                code: 'INVALID_NETWORK'
              }
            }
          ],
          data: {
            blocks: null
          }
        });
      });

      test('should throw a graphql-like error on network error (invalid hostname)', async () => {
        await expect(
          getSnapshots('1', 17789785, provider, ['5', '137'], {
            blockFinderUrl: 'http://localhost:12345'
          })
        ).to.rejects.toEqual({
          errors: [
            {
              extensions: { code: 0 },
              message: expect.stringContaining('no response')
            }
          ]
        });
      });

      test('should throw a graphql-like error on network error (not found)', async () => {
        await expect(
          getSnapshots('1', 17789786, provider, ['5', '137'], {
            blockFinderUrl: 'http://httpstat.us/404'
          })
        ).to.rejects.toEqual({
          errors: [
            {
              extensions: { code: 404 },
              message: 'Not Found'
            }
          ]
        });
      });
    });
  });
});
