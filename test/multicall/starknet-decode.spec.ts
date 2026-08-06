import { describe, it, expect } from 'vitest';
import { parse } from './starknet-stub';

describe('multicall/starknet', () => {
  describe('parsing felt252 outputs', () => {
    const abi = [
      {
        name: 'identify',
        outputs: [{ type: 'core::felt252' }]
      }
    ];

    it('decodes a felt252 holding a short string', async () => {
      const result = await parse(abi, 'identify', ['0x55534420436f696e']);

      expect(result).toEqual(['USD Coin']);
    });

    it('returns the raw felt252 when it does not hold a short string', async () => {
      const result = await parse(abi, 'identify', ['0xb5b47279a7f0c']);

      expect(result).toEqual(['0xb5b47279a7f0c']);
    });

    it('returns the raw felt252 when the decoded string encodes back to a different felt', async () => {
      const result = await parse(abi, 'identify', ['0x5553444']);

      expect(result).toEqual(['0x5553444']);
    });
  });

  describe('parsing felt252 items inside a sequence', () => {
    it('leaves every item of a Span raw, including one that holds a short string', async () => {
      const result = await parse(
        [
          {
            name: 'address_to_domain',
            outputs: [{ type: 'core::array::Span::<core::felt252>' }]
          }
        ],
        'address_to_domain',
        ['0x3', '0x55534420436f696e', '0x5553444', '0xb5b47279a7f0c']
      );

      expect(result).toEqual([
        ['0x55534420436f696e', '0x5553444', '0xb5b47279a7f0c']
      ]);
    });

    it('leaves every item of an Array raw, including one that holds a short string', async () => {
      const result = await parse(
        [
          {
            name: 'get_items',
            outputs: [{ type: 'core::array::Array::<core::felt252>' }]
          }
        ],
        'get_items',
        ['0x3', '0xb5b47279a7f0c', '0x737461726b', '0x5553444']
      );

      expect(result).toEqual([
        ['0xb5b47279a7f0c', '0x737461726b', '0x5553444']
      ]);
    });

    it('keeps a span item convertible back to a felt when every byte is printable', async () => {
      // 0x204d4e is the starknet.id encoding of abwab.stark. Decoding it as a
      // short string gives ' MN', which BigInt() cannot read back.
      const result = await parse(
        [
          {
            name: 'address_to_domain',
            outputs: [{ type: 'core::array::Span::<core::felt252>' }]
          }
        ],
        'address_to_domain',
        ['0x1', '0x204d4e']
      );

      expect(result).toEqual([['0x204d4e']]);
      expect((result as string[][])[0].map(BigInt)).toEqual([
        BigInt('0x204d4e')
      ]);
    });
  });
});
