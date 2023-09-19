import { test, expect, describe } from 'vitest';
import { getScores } from '../../../src/utils';

describe('test getScores', () => {
  test('getScores should returns a promise rejection on error from score-api', async () => {
    expect.assertions(1);
    await expect(
      getScores('test.eth', [], '1', ['0x0'])
    ).to.rejects.toHaveProperty('code');
  });
});
