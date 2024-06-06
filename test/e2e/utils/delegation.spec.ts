import { test, expect, describe } from 'vitest';
import { getDelegatesBySpace } from '../../../src/utils';
import fixtures from '../../examples/delegates.json';

const SPACE = 'stgdao.eth';
const NETWORK = '42161';
const BLOCK_NUMBER = 73900000;

describe('test delegation', () => {
  describe('getDelegatesBySpace()', () => {
    test('should return a list of delegations at specified block', async () => {
      expect.assertions(2);
      const results: any = await getDelegatesBySpace(
        NETWORK,
        SPACE,
        BLOCK_NUMBER
      );

      expect(results.length).toEqual(fixtures.length);
      expect(
        results.every((a: any) => {
          return fixtures.some((b) => {
            return (
              a.delegator === b.delegator &&
              a.space === b.space &&
              a.delegate === b.delegate
            );
          });
        })
      ).toEqual(true);
    });

    test('should return an empty array when no results', async () => {
      expect.assertions(1);
      const results: any = await getDelegatesBySpace(NETWORK, SPACE, 22531440);

      expect(results.length).toEqual(0);
    });

    test('should reject with a message on unsupported network', async () => {
      expect.assertions(1);
      await expect(
        getDelegatesBySpace('99999', SPACE, BLOCK_NUMBER)
      ).to.rejects.toMatch(/not available/);
    });

    test('should raise error on subgraph graphql errors', async () => {
      expect.assertions(1);
      await expect(getDelegatesBySpace('1', SPACE, 0)).to.rejects.toMatch(
        /startBlock/
      );
    });
  });
});
