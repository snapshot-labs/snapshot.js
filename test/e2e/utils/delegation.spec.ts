import { test, expect, describe } from 'vitest';
import { getDelegatesBySpace } from '../../../src/utils';
import { mergeWithoutDuplicates } from '../../../src/utils/delegation';
import fixtures from '../../examples/delegates.json';

const SPACE = 'stgdao.eth';
const NETWORK = '42161';
const BLOCK_NUMBER = 73900000;

describe('test delegation', () => {
  test('getDelegatesBySpace should return a list of delegations at specified block', async () => {
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

  test('getDelegatesBySpace should return an empty array when no results', async () => {
    expect.assertions(1);
    const results: any = await getDelegatesBySpace(NETWORK, SPACE, 22531439);

    expect(results.length).toEqual(0);
  });

  test('getDelegatesBySpace should reject with a message on unsupported network', async () => {
    expect.assertions(1);
    await expect(
      getDelegatesBySpace('99999', SPACE, BLOCK_NUMBER)
    ).to.rejects.toMatch(/not available/);
  });

  test('mergeWithoutDuplicates should merge two lists without duplicates', async () => {
    expect.assertions(1);
    const listA = [
      { delegator: '0x1', delegate: '0x2', space: 'space', timestamp: 1 },
      { delegator: '0x1', delegate: '0x2', space: 'space', timestamp: 2 },
      { delegator: '0x1', delegate: '0x1', space: 'space', timestamp: 3 },
      { delegator: '0x1', delegate: '0x2', space: 'space', timestamp: 3 }
    ];
    const listB = [
      { delegator: '0x1', delegate: '0x2', space: 'space', timestamp: 3 },
      { delegator: '0x1', delegate: '0x3', space: 'space', timestamp: 3 },
      { delegator: '0x1', delegate: '0x2', space: 'space', timestamp: 4 }
    ];
    const result = mergeWithoutDuplicates(listA, listB);
    expect(result).toEqual([
      { delegator: '0x1', delegate: '0x2', space: 'space', timestamp: 1 },
      { delegator: '0x1', delegate: '0x2', space: 'space', timestamp: 2 },
      { delegator: '0x1', delegate: '0x1', space: 'space', timestamp: 3 },
      { delegator: '0x1', delegate: '0x2', space: 'space', timestamp: 3 },
      { delegator: '0x1', delegate: '0x3', space: 'space', timestamp: 3 },
      { delegator: '0x1', delegate: '0x2', space: 'space', timestamp: 4 }
    ]);
  });
});
