import { test, expect, describe } from 'vitest';
import { getSnapshots } from '../../../src/utils/blockfinder';
import getProvider from '../../../src/utils/provider';

describe('Test block finder', () => {
  const provider = getProvider('1');
  test('getSnapshots should work without errors and return object', async () => {
    expect(
      await getSnapshots('1', 17789783, provider, ['11155111', '137'])
    ).toMatchObject({
      '1': 17789783,
      '137': 45609596,
      '11155111': 3979201
    });
  });
  test('getSnapshots should return all latest if snapshot is latest', async () => {
    expect(
      await getSnapshots('1', 'latest', provider, ['11155111', '137'])
    ).toMatchObject({
      '137': 'latest',
      '11155111': 'latest'
    });
  });
});
