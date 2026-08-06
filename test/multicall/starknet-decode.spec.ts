import { describe, it, expect } from 'vitest';
import { parse } from './starknet-stub';

describe('multicall/starknet decoding', () => {
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

    it('decodes a felt252 holding a short string with a control character', async () => {
      // Reported by @wa0x6e. `shortString.encodeShortString` emits an
      // unpadded `charCodeAt(0).toString(16)`, so the tab re-encodes as
      // `0x5553449436f696e`, one hex digit short, and the round-trip guard
      // rejected a felt that master decoded.
      const result = await parse(abi, 'identify', ['0x55534409436f696e']);

      expect(result).toEqual(['USD\tCoin']);
    });

    // The whole class, not just the tab: every byte below 0x10 is one hex
    // digit when unpadded. 0x0a and 0x0d are in here deliberately, since an
    // encoder written as `str.replace(/./g, ...)` skips them (`.` does not
    // match a line terminator) and would leave two of the sixteen broken.
    const controlBytes = Array.from({ length: 0x10 }, (_, byte) => byte);

    it.each(controlBytes)(
      'decodes a felt252 whose bytes include 0x%s',
      async (byte) => {
        const raw = `0x555344${byte.toString(16).padStart(2, '0')}436f696e`;
        const result = await parse(abi, 'identify', [raw]);

        expect(result).toEqual([`USD${String.fromCharCode(byte)}Coin`]);
      }
    );

    it('still returns the raw felt252 when a byte is above 0x7f', async () => {
      // The guard's reason for existing: these decode to mojibake that
      // `BigInt()` cannot read back. Padding the re-encode must not widen the
      // round trip past the ASCII bound `encodeShortString` used to enforce.
      const result = await parse(abi, 'identify', ['0xcafebabe']);

      expect(result).toEqual(['0xcafebabe']);
      expect(BigInt((result as string[])[0])).toEqual(BigInt('0xcafebabe'));
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
