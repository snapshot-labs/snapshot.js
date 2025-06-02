import { describe, it, expect } from 'vitest';
import utils from '../../src/utils';
import getProvider from '../../src/utils/provider';

describe('utils', () => {
  describe('multicall()', () => {
    const network = '1'; // Ethereum mainnet
    const provider = getProvider(network);

    describe('ERC20 token calls', () => {
      it('should get token information for multiple tokens', async () => {
        const erc20Abi = [
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)',
          'function totalSupply() view returns (uint256)'
        ];

        // Well-known token addresses
        const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC
        const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI

        const calls = [
          [usdcAddress, 'name', []],
          [usdcAddress, 'symbol', []],
          [usdcAddress, 'decimals', []],
          [daiAddress, 'name', []],
          [daiAddress, 'symbol', []],
          [daiAddress, 'decimals', []]
        ];

        const results = await utils.multicall(
          network,
          provider,
          erc20Abi,
          calls
        );

        expect(results).toHaveLength(6);
        expect(results[0][0]).toBe('USD Coin');
        expect(results[1][0]).toBe('USDC');
        expect(results[2][0]).toBe(6);
        expect(results[3][0]).toBe('Dai Stablecoin');
        expect(results[4][0]).toBe('DAI');
        expect(results[5][0]).toBe(18);
      }, 10000);

      it('should handle balance queries for multiple addresses', async () => {
        const erc20Abi = ['function balanceOf(address) view returns (uint256)'];

        const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

        // Some well-known addresses that likely hold USDC
        const addresses = [
          '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance 14
          '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance 15
          '0xF977814e90dA44bFA03b6295A0616a897441aceC' // Binance 8
        ];

        const calls = addresses.map((address) => [
          usdcAddress,
          'balanceOf',
          [address]
        ]);

        const results = await utils.multicall(
          network,
          provider,
          erc20Abi,
          calls
        );

        expect(results).toHaveLength(3);
        results.forEach((result) => {
          expect(typeof result[0]).toBe('object'); // BigNumber
          expect(result[0].toString()).toMatch(/^\d+$/); // Should be numeric string
        });
      }, 10000);
    });

    describe('ENS registry calls', () => {
      it('should resolve multiple ENS names', async () => {
        const ensAbi = [
          'function resolver(bytes32 node) view returns (address)',
          'function owner(bytes32 node) view returns (address)'
        ];

        const ensRegistryAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

        // Some well-known ENS name hashes
        const ethNameHash =
          '0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae'; // vitalik.eth
        const ensNameHash =
          '0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835'; // nick.eth

        const calls = [
          [ensRegistryAddress, 'owner', [ethNameHash]],
          [ensRegistryAddress, 'resolver', [ethNameHash]],
          [ensRegistryAddress, 'owner', [ensNameHash]],
          [ensRegistryAddress, 'resolver', [ensNameHash]]
        ];

        const results = await utils.multicall(network, provider, ensAbi, calls);

        expect(results).toHaveLength(4);
        results.forEach((result) => {
          expect(typeof result[0]).toBe('string');
          expect(result[0]).toMatch(/^0x[a-fA-F0-9]{40}$/); // Valid address format
        });
      }, 10000);
    });

    describe('pagination and limits', () => {
      it('should handle large number of calls with pagination', async () => {
        const erc20Abi = ['function decimals() view returns (uint8)'];

        const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

        // Create 600 calls to test pagination (default limit is 500)
        const calls = Array(600).fill([usdcAddress, 'decimals', []]);

        const results = await utils.multicall(
          network,
          provider,
          erc20Abi,
          calls,
          {
            limit: 300 // Custom limit
          }
        );

        expect(results).toHaveLength(600);
        results.forEach((result) => {
          expect(result[0]).toBe(6); // USDC has 6 decimals
        });
      }, 15000);

      it('should work with custom multicall address', async () => {
        const erc20Abi = ['function symbol() view returns (string)'];

        const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
        const calls = [[usdcAddress, 'symbol', []]];

        // Use the same multicall address (should work the same)
        const results = await utils.multicall(
          network,
          provider,
          erc20Abi,
          calls,
          {
            multicallAddress: '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441'
          }
        );

        expect(results).toHaveLength(1);
        expect(typeof results[0][0]).toBe('string');
      }, 10000);
    });

    describe('error handling', () => {
      it('should reject when contract call fails', async () => {
        const invalidAbi = [
          'function nonExistentFunction() view returns (string)'
        ];

        const usdcAddress = '0xA0b86a33E6417c9AFc5cEaD24F68e77cc9353Bbf';
        const calls = [[usdcAddress, 'nonExistentFunction', []]];

        await expect(
          utils.multicall(network, provider, invalidAbi, calls)
        ).rejects.toThrow();
      }, 10000);

      it('should reject when using invalid contract address', async () => {
        const erc20Abi = ['function symbol() view returns (string)'];

        const invalidAddress = '0x0000000000000000000000000000000000000000';
        const calls = [[invalidAddress, 'symbol', []]];

        await expect(
          utils.multicall(network, provider, erc20Abi, calls)
        ).rejects.toThrow();
      }, 10000);
    });

    describe('different networks', () => {
      it('should work on Polygon network', async () => {
        const polygonNetwork = '137';
        const polygonProvider = getProvider(polygonNetwork);

        const erc20Abi = [
          'function name() view returns (string)',
          'function symbol() view returns (string)'
        ];

        // USDC on Polygon
        const usdcPolygonAddress = '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359';
        const calls = [
          [usdcPolygonAddress, 'name', []],
          [usdcPolygonAddress, 'symbol', []]
        ];

        const results = await utils.multicall(
          polygonNetwork,
          polygonProvider,
          erc20Abi,
          calls
        );

        expect(results).toHaveLength(2);
        expect(results[0][0]).toBe('USD Coin');
        expect(results[1][0]).toBe('USDC');
      }, 10000);
    });
  });
});
