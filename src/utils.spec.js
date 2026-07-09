import { describe, test, expect, vi, afterEach } from 'vitest';
import * as crossFetch from 'cross-fetch';
import {
  validate,
  validateSchema,
  getScores,
  getVp,
  getFormattedAddress,
  getEnsOwner,
  getEnsTextRecord
} from './utils';

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

vi.mock('cross-fetch', async () => {
  const actual = await vi.importActual('cross-fetch');

  return {
    ...actual,
    default: vi.fn()
  };
});
const fetch = vi.mocked(crossFetch.default);

describe('utils', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validate', () => {
    const payload = {
      validation: 'basic',
      author: '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
      space: 'fabien.eth',
      network: '1',
      snapshot: 7929876,
      params: {
        minScore: 0.9,
        strategies: [
          {
            name: 'eth-balance',
            params: {}
          }
        ]
      }
    };

    function _validate({
      validation,
      author,
      space,
      network,
      snapshot,
      params,
      options
    }) {
      return validate(
        validation ?? payload.validation,
        author ?? payload.author,
        space ?? payload.space,
        network ?? payload.network,
        snapshot ?? payload.snapshot,
        params ?? payload.params,
        options ?? {}
      );
    }

    describe('when passing invalid args', () => {
      const cases = [
        [
          'author is an invalid address',
          { author: 'test-address' },
          /invalid author/i
        ],
        ['network is not valid', { network: 'mainnet' }, /invalid network/i],
        ['network is empty', { network: '' }, /invalid network/i],
        [
          'snapshot is smaller than start block',
          { snapshot: 1234 },
          /snapshot \([0-9]+\) must be 'latest' or greater than network start block/i
        ]
      ];

      test.each(cases)('throw an error when %s', async (title, args, err) => {
        await expect(_validate(args)).rejects.toMatch(err);
      });
    });

    describe('when passing valid args', () => {
      test('send a JSON-RPC payload to score-api', async () => {
        const result = { result: 'OK' };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_validate({})).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://score.snapshot.org/',
          expect.objectContaining({
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'validate',
              params: payload
            })
          })
        );
      });

      test('send a POST request with JSON content-type', async () => {
        const result = { result: 'OK' };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_validate({})).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://score.snapshot.org/',
          expect.objectContaining({
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          })
        );
      });

      test('can customize the score-api url', () => {
        const result = { result: 'OK' };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(
          _validate({ options: { url: 'https://snapshot.org/?apiKey=xxx' } })
        ).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://snapshot.org/',
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-API-KEY': 'xxx'
            })
          })
        );
      });

      test('returns the JSON-RPC result property', () => {
        const result = { result: 'OK' };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_validate({})).resolves.toEqual('OK');
      });
    });

    describe('when score-api is sending a JSON-RPC error', () => {
      test('rejects with the JSON-RPC error object', () => {
        const result = { error: { message: 'Oh no' } };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_validate({})).rejects.toEqual(result.error);
      });
    });

    describe('when the fetch request is failing with not network error', () => {
      test('rejects with the error', () => {
        const result = new Error('Oh no');
        fetch.mockReturnValue({
          text: () => {
            throw result;
          }
        });

        expect(_validate({})).rejects.toEqual(result);
      });
    });
  });
  describe('getScores', () => {
    const payload = {
      space: 'test.eth',
      network: '1',
      snapshot: 7929876,
      strategies: [
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
      addresses: ['0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11']
    };

    function _getScores({
      space,
      strategies,
      network,
      addresses,
      snapshot,
      scoreApiUrl,
      options
    }) {
      return getScores(
        space ?? payload.space,
        strategies ?? payload.strategies,
        network ?? payload.network,
        addresses ?? payload.addresses,
        snapshot ?? payload.snapshot,
        scoreApiUrl ?? 'https://score.snapshot.org/',
        options ?? {}
      );
    }

    describe('when passing invalid args', () => {
      const cases = [
        [
          'addresses contains invalid address',
          { addresses: ['test-address'] },
          /invalid address/i
        ],
        [
          'addresses is not an array',
          { addresses: 'test-address' },
          /addresses should be an array/i
        ],
        [
          'addresses is an empty array',
          { addresses: [] },
          /addresses can not be empty/i
        ],
        ['network is not valid', { network: 'mainnet' }, /invalid network/i],
        ['network is empty', { network: '' }, /invalid network/i],
        [
          'snapshot is smaller than start block',
          { snapshot: 1234 },
          /snapshot \([0-9]+\) must be 'latest' or greater than network start block/i
        ],
        [
          'strategy contains invalid network',
          { strategies: [{ name: '', network: 'test' }] },
          /invalid network \(.*\) in strategy/i
        ]
      ];

      test.each(cases)('throw an error when %s', async (title, args, err) => {
        await expect(_getScores(args)).rejects.toMatch(err);
      });
    });

    describe('when passing valid args', () => {
      test('send a JSON-RPC payload to score-api', async () => {
        const result = { result: 'OK' };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_getScores({})).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://score.snapshot.org/api/scores',
          expect.objectContaining({
            body: JSON.stringify({ params: payload })
          })
        );
      });

      test('send a POST request with JSON content-type', async () => {
        const result = { result: 'OK' };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_getScores({})).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://score.snapshot.org/api/scores',
          expect.objectContaining({
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          })
        );
      });

      test('can customize the score-api url and if apiKey should be passed in headers', () => {
        const result = { result: 'OK' };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_getScores({ scoreApiUrl: 'https://snapshot.org/?apiKey=xxx' }))
          .resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://snapshot.org/api/scores',
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-API-KEY': 'xxx'
            })
          })
        );
      });

      test('returns the JSON-RPC result scores property', () => {
        const result = { scores: 'SCORES', other: 'Other' };
        fetch.mockReturnValue({
          text: () =>
            new Promise((resolve) => resolve(JSON.stringify({ result })))
        });

        expect(_getScores({})).resolves.toEqual('SCORES');
      });

      test('returns the JSON-RPC all properties', () => {
        const result = { scores: 'SCORES', other: 'Other' };
        fetch.mockReturnValue({
          text: () =>
            new Promise((resolve) => resolve(JSON.stringify({ result })))
        });

        expect(
          _getScores({ options: { returnValue: 'all' } })
        ).resolves.toEqual(result);
      });
    });

    describe('when score-api is sending a JSON-RPC error', () => {
      test('rejects with the JSON-RPC error object', () => {
        const result = { error: { message: 'Oh no' } };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_getScores({})).rejects.toEqual(result.error);
      });
    });

    describe('when the fetch request is failing with not network error', () => {
      test('rejects with the error', () => {
        const result = new Error('Oh no');
        fetch.mockReturnValue({
          text: () => {
            throw result;
          }
        });

        expect(_getScores({})).rejects.toEqual(result);
      });
    });
  });
  describe('getVp', () => {
    const payload = {
      address: '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
      network: '1',
      strategies: [
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
      snapshot: 7929876,
      space: 'test.eth',
      options: undefined
    };

    function _getVp({ voter, network, strategies, snapshot, options }) {
      return getVp(
        voter ?? payload.address,
        network ?? payload.network,
        strategies ?? payload.strategies,
        snapshot ?? payload.snapshot,
        'test.eth' ?? payload.space,
        false,
        options ?? payload.options
      );
    }

    describe('when passing invalid args', () => {
      const cases = [
        [
          'voter is not a valid address',
          { voter: 'test-address' },
          /invalid voter address/i
        ],
        ['voter is empty', { voter: '' }, /invalid voter address/i],
        ['network is not valid', { network: 'mainnet' }, /invalid network/i],
        ['network is empty', { network: '' }, /invalid network/i],
        [
          'snapshot is smaller than start block',
          { snapshot: 1234 },
          /snapshot \([0-9]+\) must be 'latest' or greater than network start block/i
        ],
        [
          'strategy contains invalid network',
          { strategies: [{ name: '', network: 'test' }] },
          /invalid network \(.*\) in strategy/i
        ]
      ];

      test.each(cases)('throw an error when %s', async (title, args, err) => {
        await expect(_getVp(args)).rejects.toMatch(err);
      });
    });

    describe('when passing valid args', () => {
      test('send a JSON-RPC payload to score-api', async () => {
        const result = { result: 'OK' };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_getVp({})).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://score.snapshot.org/',
          expect.objectContaining({
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'get_vp',
              params: payload
            })
          })
        );
      });

      test('send a POST request with JSON content-type', async () => {
        const result = { result: 'OK' };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_getVp({})).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://score.snapshot.org/',
          expect.objectContaining({
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          })
        );
      });

      test('can customize the score-api url', () => {
        const result = { result: 'OK' };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_getVp({ options: { url: 'https://snapshot.org' } })).resolves;
        expect(fetch).toHaveBeenCalledWith(
          'https://snapshot.org/',
          expect.anything()
        );
      });

      test('returns the JSON-RPC result property', () => {
        const result = { data: 'OK' };
        fetch.mockReturnValue({
          text: () =>
            new Promise((resolve) => resolve(JSON.stringify({ result })))
        });

        expect(_getVp({})).resolves.toEqual(result);
      });
    });

    describe('when score-api is sending a JSON-RPC error', () => {
      test('rejects with the JSON-RPC error object', () => {
        const result = { error: { message: 'Oh no' } };
        fetch.mockReturnValue({
          text: () => new Promise((resolve) => resolve(JSON.stringify(result)))
        });

        expect(_getVp({})).rejects.toEqual(result.error);
      });
    });

    describe('when the fetch request is failing with not network error', () => {
      test('rejects with the error', () => {
        const result = new Error('Oh no');
        fetch.mockReturnValue({
          text: () => {
            throw result;
          }
        });

        expect(_getVp({})).rejects.toEqual(result);
      });
    });
  });

  describe('getFormattedAddress', () => {
    describe('when explicitly passing an address type', () => {
      describe('EVM type parsing', () => {
        test('should return checksummed EVM address when given checksummed input', () => {
          const address = '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3';
          expect(getFormattedAddress(address, 'evm')).toEqual(
            '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3'
          );
        });

        test('should return checksummed EVM address when given lowercase input', () => {
          const address = '0x91fd2c8d24767db4ece7069aa27832ffaf8590f3';
          expect(getFormattedAddress(address, 'evm')).toEqual(
            '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3'
          );
        });

        test('should return checksummed EVM address when given uppercase input', () => {
          const uppercaseAddress = '0x91FD2C8D24767DB4ECE7069AA27832FFAF8590F3';
          expect(getFormattedAddress(uppercaseAddress, 'evm')).toEqual(
            '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3'
          );
        });

        test('should throw error when forcing EVM parsing on address with uppercase 0X prefix', () => {
          const uppercaseHexPrefix =
            '0X91FD2C8D24767DB4ECE7069AA27832FFAF8590F3';
          expect(() => getFormattedAddress(uppercaseHexPrefix, 'evm')).toThrow(
            'Invalid evm address: 0X91FD2C8D24767DB4ECE7069AA27832FFAF8590F3'
          );
        });

        test('should throw error when forcing EVM parsing on invalid mixed case address', () => {
          const invalidMixedCaseAddress =
            '0x91Fd2C8d24767Db4eCe7069aA27832FfaF8590F3';
          expect(() =>
            getFormattedAddress(invalidMixedCaseAddress, 'evm')
          ).toThrow(
            'Invalid evm address: 0x91Fd2C8d24767Db4eCe7069aA27832FfaF8590F3'
          );
        });

        test('should throw error when address is not an EVM address', () => {
          const address =
            '0x2a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0';
          expect(() => getFormattedAddress(address, 'evm')).toThrow(
            'Invalid evm address: 0x2a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
          );
        });
      });

      describe('Starknet type parsing', () => {
        test('should return padded and lowercased starknet address when given unpadded input', () => {
          const address =
            '0x2a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0';
          expect(getFormattedAddress(address, 'starknet')).toEqual(
            '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
          );
        });

        test('should return padded and lowercased starknet address when given lowercase input', () => {
          const address =
            '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0';
          expect(getFormattedAddress(address, 'starknet')).toEqual(
            '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
          );
        });

        test('should return padded and lowercased starknet address when given uppercase Starknet input', () => {
          const uppercaseAddress =
            '0x02A0A8F3B6097E7A6BD7649DEB30715323072A159C0E6B71B689BD245C146CC0';
          expect(getFormattedAddress(uppercaseAddress, 'starknet')).toEqual(
            '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
          );
        });

        test('should return padded and lowercased starknet address when given checksum Starknet input', () => {
          const checksumAddress =
            '0x02a0a8F3B6097e7A6bd7649DEB30715323072A159c0E6B71B689Bd245c146cC0';
          expect(getFormattedAddress(checksumAddress, 'starknet')).toEqual(
            '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
          );
        });

        test('should return padded and lowercased starknet address when given mixed case Starknet input', () => {
          const mixedCaseAddress =
            '0x02A0a8F3B6097e7A6bD7649DEB30715323072a159C0e6b71B689BD245c146Cc0';
          expect(getFormattedAddress(mixedCaseAddress, 'starknet')).toEqual(
            '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
          );
        });

        test('should return EVM address as starknet address when explicitly formatted', () => {
          const address = '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3';
          expect(getFormattedAddress(address, 'starknet')).toEqual(
            '0x00000000000000000000000091fd2c8d24767db4ece7069aa27832ffaf8590f3'
          );
        });

        test('should throw error when given invalid Starknet address with explicit format', () => {
          const invalidStarknetAddress = '0xinvalidstarknetaddresshere';
          expect(() =>
            getFormattedAddress(invalidStarknetAddress, 'starknet')
          ).toThrow('Invalid starknet address: 0xinvalidstarknetaddresshere');
        });
      });
    });

    describe('when not passing an address type', () => {
      describe('EVM address auto-detection', () => {
        test('should auto-detect and format valid 42-char lowercase EVM address', () => {
          const address = '0x91fd2c8d24767db4ece7069aa27832ffaf8590f3';
          expect(getFormattedAddress(address)).toEqual(
            '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3'
          );
        });

        test('should auto-detect and format valid 42-char uppercase EVM address', () => {
          const address = '0x91FD2C8D24767DB4ECE7069AA27832FFAF8590F3';
          expect(getFormattedAddress(address)).toEqual(
            '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3'
          );
        });

        test('should auto-detect and format valid 42-char checksummed EVM address', () => {
          const address = '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3';
          expect(getFormattedAddress(address)).toEqual(
            '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3'
          );
        });

        test('should throw error when auto-detecting invalid mixed case EVM address', () => {
          const invalidMixedCaseAddress =
            '0x91Fd2C8d24767Db4eCe7069aA27832FfaF8590F3';
          expect(() => getFormattedAddress(invalidMixedCaseAddress)).toThrow(
            'Invalid evm address: 0x91Fd2C8d24767Db4eCe7069aA27832FfaF8590F3'
          );
        });

        test('should throw error when auto-detecting 42-char invalid hex address', () => {
          const invalidHexAddress =
            '0xgggggggggggggggggggggggggggggggggggggggg';
          expect(() => getFormattedAddress(invalidHexAddress)).toThrow(
            'Invalid evm address: 0xgggggggggggggggggggggggggggggggggggggggg'
          );
        });

        test('should throw error when auto-detecting EVM address with uppercase 0X prefix', () => {
          const uppercaseHexPrefix =
            '0X91FD2C8D24767DB4ECE7069AA27832FFAF8590F3';
          expect(() => getFormattedAddress(uppercaseHexPrefix)).toThrow(
            'Invalid evm address: 0X91FD2C8D24767DB4ECE7069AA27832FFAF8590F3'
          );
        });
      });

      describe('Starknet address auto-detection', () => {
        test('should auto-detect and format valid unpadded Starknet address', () => {
          const address =
            '0x2a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0';
          expect(getFormattedAddress(address)).toEqual(
            '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
          );
        });

        test('should auto-detect and format valid padded Starknet address', () => {
          const address =
            '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0';
          expect(getFormattedAddress(address)).toEqual(
            '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
          );
        });

        test('should auto-detect and format uppercase Starknet address', () => {
          const address =
            '0x02A0A8F3B6097E7A6BD7649DEB30715323072A159C0E6B71B689BD245C146CC0';
          expect(getFormattedAddress(address)).toEqual(
            '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
          );
        });

        test('should return padded and lowercased address when input has uppercase 0X prefix', () => {
          const fullyUppercaseAddress =
            '0X02A0A8F3B6097E7A6BD7649DEB30715323072A159C0E6B71B689BD245C146CC0';
          expect(getFormattedAddress(fullyUppercaseAddress)).toEqual(
            '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
          );
        });

        test('should return padded and lowercased address when given short input', () => {
          const address = '0x1';
          expect(getFormattedAddress(address)).toEqual(
            '0x0000000000000000000000000000000000000000000000000000000000000001'
          );
        });

        test('should auto-detect actual 41-char address as Starknet', () => {
          const address = '0x123456789012345678901234567890123456789';
          expect(getFormattedAddress(address)).toEqual(
            '0x0000000000000000000000000123456789012345678901234567890123456789'
          );
        });

        test('should auto-detect 43+ char address as Starknet', () => {
          const address = '0x123456789012345678901234567890123456789012';
          expect(getFormattedAddress(address)).toEqual(
            '0x0000000000000000000000123456789012345678901234567890123456789012'
          );
        });
      });

      describe('Invalid address format', () => {
        test('should throw error when passing invalid format argument', () => {
          const validAddress = '0x91fd2c8d24767db4ece7069aa27832ffaf8590f3';
          expect(() => getFormattedAddress(validAddress, 'invalid')).toThrow(
            'Invalid invalid address: 0x91fd2c8d24767db4ece7069aa27832ffaf8590f3'
          );
        });

        test('should treat undefined format parameter as auto-detection', () => {
          const evmAddress = '0x91fd2c8d24767db4ece7069aa27832ffaf8590f3';
          expect(getFormattedAddress(evmAddress, undefined)).toEqual(
            '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3'
          );
        });

        test('should throw error when parsing invalid string', () => {
          const invalidString = 'hello';
          expect(() => getFormattedAddress(invalidString)).toThrow(
            'Invalid address: hello'
          );
        });

        test('should throw error when parsing empty string', () => {
          const emptyString = '';
          expect(() => getFormattedAddress(emptyString)).toThrow(
            'Invalid address: '
          );
        });

        test('should throw error when parsing null input', () => {
          expect(() => getFormattedAddress(null)).toThrow(
            'Invalid address: null'
          );
        });

        test('should throw error when parsing undefined input', () => {
          expect(() => getFormattedAddress(undefined)).toThrow(
            'Invalid address: undefined'
          );
        });

        test('should throw error when parsing number input', () => {
          expect(() => getFormattedAddress(123)).toThrow(
            'Invalid address: 123'
          );
        });

        test('should throw error when parsing object input', () => {
          expect(() => getFormattedAddress({})).toThrow(
            'Invalid address: [object Object]'
          );
        });
      });
    });
  });

  describe('address validation', () => {
    const evmSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/Envelope',
      definitions: {
        Envelope: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              format: 'address'
            }
          }
        }
      }
    };

    const starknetSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/Envelope',
      definitions: {
        Envelope: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              format: 'starknetAddress'
            }
          }
        }
      }
    };

    test('should return true on checksummed EVM address', async () => {
      const result = validateSchema(evmSchema, {
        address: '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3'
      });
      expect(result).toBe(true);
    });

    test('should return an error on lowercase EVM address', async () => {
      const result = validateSchema(evmSchema, {
        address: '0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3'.toLowerCase()
      });
      expect(result).not.toBe(true);
    });

    test('should return an error on empty address', async () => {
      const result = validateSchema(evmSchema, {
        address: ''
      });
      expect(result).not.toBe(true);
    });

    test('should return true on lowercase padded starknet address', async () => {
      const result = validateSchema(starknetSchema, {
        address:
          '0x02a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
      });
      expect(result).toBe(true);
    });

    test('should return an error on non-padded starknet address', async () => {
      const result = validateSchema(starknetSchema, {
        address:
          '0x2a0a8f3b6097e7a6bd7649deb30715323072a159c0e6b71b689bd245c146cc0'
      });
      expect(result).not.toBe(true);
    });

    test('should return an error on empty starknet address', async () => {
      const result = validateSchema(starknetSchema, {
        address: ''
      });
      expect(result).not.toBe(true);
    });
  });

  describe('getEnsOwner', () => {
    test('should return null when the ENS is not valid', () => {
      // special hidden characters after the k
      expect(getEnsOwner('elonmusk‍‍.eth')).resolves.toBe(EMPTY_ADDRESS);
    });

    test('throw an error when the network is not supported', () => {
      expect(getEnsOwner('shot.eth', '100')).rejects.toThrow(
        'Network not supported'
      );
    });
  });

  describe('getEnsTextRecord', () => {
    test('should return null when the ENS is not valid', () => {
      // special hidden characters after the k
      expect(getEnsTextRecord('elonmusk‍‍.eth')).resolves.toBe(null);
    });
  });
});
