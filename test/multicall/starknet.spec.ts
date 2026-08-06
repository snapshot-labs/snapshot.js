import { describe, it, expect } from 'vitest';
import { parse } from './starknet-stub';

describe('multicall/starknet', () => {
  describe('parsing Span outputs', () => {
    const abi = [
      {
        name: 'address_to_domain',
        outputs: [{ type: 'core::array::Span::<core::felt252>' }]
      }
    ];

    it('parses a flat span of felt252', async () => {
      const result = await parse(abi, 'address_to_domain', [
        '0x1',
        '0xb5b47279a7f0c'
      ]);

      expect(result).toEqual([['0xb5b47279a7f0c']]);
    });

    it('parses a span with several items', async () => {
      const result = await parse(abi, 'address_to_domain', [
        '0x2',
        '0xb5b47279a7f0c',
        '0x15d246f6c1b'
      ]);

      expect(result).toEqual([['0xb5b47279a7f0c', '0x15d246f6c1b']]);
    });

    it('parses an empty span', async () => {
      const result = await parse(abi, 'address_to_domain', ['0x0']);

      expect(result).toEqual([[]]);
    });

    it('parses an Array of felt252', async () => {
      const result = await parse(
        [
          {
            name: 'get_items',
            outputs: [{ type: 'core::array::Array::<core::felt252>' }]
          }
        ],
        'get_items',
        ['0x2', '0x55534420436f696e', '0xb5b47279a7f0c']
      );

      expect(result).toEqual([['0x55534420436f696e', '0xb5b47279a7f0c']]);
    });

    it('keeps parsing the outputs that follow a span', async () => {
      const result = await parse(
        [
          {
            name: 'get_domain_and_owner',
            outputs: [
              { type: 'core::array::Span::<core::felt252>' },
              { type: 'core::starknet::contract_address::ContractAddress' },
              { type: 'core::bool' }
            ]
          }
        ],
        'get_domain_and_owner',
        [
          '0x2',
          '0xb5b47279a7f0c',
          '0x15d246f6c1b',
          '0x7ff6b17f07c4d83236e3fc5f94259a19d1ed41bbcf1822397ea17882e9b038d',
          '0x1'
        ]
      );

      expect(result).toEqual([
        ['0xb5b47279a7f0c', '0x15d246f6c1b'],
        '0x7ff6b17f07c4d83236e3fc5f94259a19d1ed41bbcf1822397ea17882e9b038d',
        true
      ]);
    });
  });

  describe('parsing malformed Span responses', () => {
    const abi = [
      {
        name: 'address_to_domain',
        outputs: [{ type: 'core::array::Span::<core::felt252>' }]
      }
    ];

    it('returns the items that are there when the span declares more than the response holds', async () => {
      const result = await parse(abi, 'address_to_domain', [
        '0x5',
        '0xb5b47279a7f0c'
      ]);

      expect(result).toEqual([['0xb5b47279a7f0c']]);
    });

    it('returns an empty span when the response stops at the length felt', async () => {
      const result = await parse(abi, 'address_to_domain', ['0x2']);

      expect(result).toEqual([[]]);
    });

    it('takes what is there when the length felt is larger than any real length', async () => {
      const result = await parse(abi, 'address_to_domain', [
        '0x800000000000011000000000000000000000000000000000000000000000000',
        '0xb5b47279a7f0c',
        '0x15d246f6c1b'
      ]);

      expect(result).toEqual([['0xb5b47279a7f0c', '0x15d246f6c1b']]);
    });

    it('leaves the span slot empty rather than discarding the outputs already parsed', async () => {
      const result = await parse(
        [
          {
            name: 'get_owner_and_domain',
            outputs: [
              { type: 'core::starknet::contract_address::ContractAddress' },
              { type: 'core::integer::u8' },
              { type: 'core::bool' },
              { type: 'core::array::Span::<core::felt252>' }
            ]
          }
        ],
        'get_owner_and_domain',
        ['0xabc', '0x5', '0x1']
      );

      // `undefined`, not `[]`: a caller cannot tell an empty span from a
      // missing one, and an empty span is a real answer here (an address
      // with no domain).
      expect(result).toStrictEqual(['0xabc', 5, true, undefined]);
    });

    it('returns the raw felts instead of throwing when the length felt is not a number', async () => {
      const result = await parse(abi, 'address_to_domain', [
        'not-a-felt',
        '0xb5b47279a7f0c'
      ]);

      expect(result).toEqual(['not-a-felt', '0xb5b47279a7f0c']);
    });
  });
});
