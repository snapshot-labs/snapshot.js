import { describe, it, expect } from 'vitest';
import Multicaller from '../../../src/multicall/multicaller';
import getProvider from '../../../src/utils/provider';

describe('Multicaller integration tests', () => {
  const network = '1'; // Ethereum mainnet
  const provider = getProvider(network);

  describe('ERC20 token calls', () => {
    it('should get token information for multiple tokens using fluent interface', async () => {
      const erc20Abi = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)'
      ];

      // Well-known token addresses
      const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC
      const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI

      const multicaller = new Multicaller(network, provider, erc20Abi);

      const result = await multicaller
        .call('usdc.name', usdcAddress, 'name')
        .call('usdc.symbol', usdcAddress, 'symbol')
        .call('usdc.decimals', usdcAddress, 'decimals')
        .call('dai.name', daiAddress, 'name')
        .call('dai.symbol', daiAddress, 'symbol')
        .call('dai.decimals', daiAddress, 'decimals')
        .execute();

      expect(result.usdc.name).toBe('USD Coin');
      expect(result.usdc.symbol).toBe('USDC');
      expect(result.usdc.decimals).toBe(6);
      expect(result.dai.name).toBe('Dai Stablecoin');
      expect(result.dai.symbol).toBe('DAI');
      expect(result.dai.decimals).toBe(18);
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

      const multicaller = new Multicaller(network, provider, erc20Abi);

      addresses.forEach((address, index) => {
        multicaller.call(`balances.${index}`, usdcAddress, 'balanceOf', [
          address
        ]);
      });

      const result = await multicaller.execute();

      expect(Object.keys(result.balances)).toHaveLength(3);
      Object.values(result.balances).forEach((balance: any) => {
        expect(typeof balance).toBe('object'); // BigNumber
        expect(balance.toString()).toMatch(/^\d+$/); // Should be numeric string
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

      const multicaller = new Multicaller(network, provider, ensAbi);

      const result = await multicaller
        .call('vitalik.owner', ensRegistryAddress, 'owner', [ethNameHash])
        .call('vitalik.resolver', ensRegistryAddress, 'resolver', [ethNameHash])
        .call('nick.owner', ensRegistryAddress, 'owner', [ensNameHash])
        .call('nick.resolver', ensRegistryAddress, 'resolver', [ensNameHash])
        .execute();

      expect(typeof result.vitalik.owner).toBe('string');
      expect(result.vitalik.owner).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(typeof result.vitalik.resolver).toBe('string');
      expect(result.vitalik.resolver).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(typeof result.nick.owner).toBe('string');
      expect(result.nick.owner).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(typeof result.nick.resolver).toBe('string');
      expect(result.nick.resolver).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }, 10000);
  });

  describe('nested object structure', () => {
    it('should build complex nested object structures', async () => {
      const erc20Abi = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)'
      ];

      const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

      const multicaller = new Multicaller(network, provider, erc20Abi);

      const result = await multicaller
        .call('tokens.usdc.info.name', usdcAddress, 'name')
        .call('tokens.usdc.info.symbol', usdcAddress, 'symbol')
        .call('tokens.usdc.info.decimals', usdcAddress, 'decimals')
        .call('tokens.dai.info.name', daiAddress, 'name')
        .call('tokens.dai.info.symbol', daiAddress, 'symbol')
        .call('tokens.dai.info.decimals', daiAddress, 'decimals')
        .execute();

      expect(result.tokens.usdc.info.name).toBe('USD Coin');
      expect(result.tokens.usdc.info.symbol).toBe('USDC');
      expect(result.tokens.usdc.info.decimals).toBe(6);
      expect(result.tokens.dai.info.name).toBe('Dai Stablecoin');
      expect(result.tokens.dai.info.symbol).toBe('DAI');
      expect(result.tokens.dai.info.decimals).toBe(18);
    }, 10000);

    it('should merge with existing object structure', async () => {
      const erc20Abi = [
        'function name() view returns (string)',
        'function decimals() view returns (uint8)'
      ];

      const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

      const existingData = {
        tokens: {
          usdc: {
            address: usdcAddress,
            network: 'ethereum'
          }
        },
        metadata: {
          timestamp: Date.now()
        }
      };

      const multicaller = new Multicaller(network, provider, erc20Abi);

      const result = await multicaller
        .call('tokens.usdc.name', usdcAddress, 'name')
        .call('tokens.usdc.decimals', usdcAddress, 'decimals')
        .execute(existingData);

      expect(result.tokens.usdc.address).toBe(usdcAddress);
      expect(result.tokens.usdc.network).toBe('ethereum');
      expect(result.tokens.usdc.name).toBe('USD Coin');
      expect(result.tokens.usdc.decimals).toBe(6);
      expect(result.metadata.timestamp).toBeDefined();
    }, 10000);
  });

  describe('options and configuration', () => {
    it('should work with custom options', async () => {
      const erc20Abi = ['function symbol() view returns (string)'];
      const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

      const multicaller = new Multicaller(network, provider, erc20Abi, {
        limit: 100
      });

      const result = await multicaller
        .call('token.symbol', usdcAddress, 'symbol')
        .execute();

      expect(result.token.symbol).toBe('USDC');
    }, 10000);

    it('should handle large number of calls with pagination', async () => {
      const erc20Abi = ['function decimals() view returns (uint8)'];
      const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

      const multicaller = new Multicaller(network, provider, erc20Abi, {
        limit: 50
      });

      // Add 100 calls
      for (let i = 0; i < 100; i++) {
        multicaller.call(`calls.${i}`, usdcAddress, 'decimals');
      }

      const result = await multicaller.execute();

      expect(Object.keys(result.calls)).toHaveLength(100);
      Object.values(result.calls).forEach((decimals: any) => {
        expect(decimals).toBe(6);
      });
    }, 15000);
  });

  describe('error handling', () => {
    it('should reject when contract call fails', async () => {
      const invalidAbi = [
        'function nonExistentFunction() view returns (string)'
      ];

      const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const multicaller = new Multicaller(network, provider, invalidAbi);

      await expect(
        multicaller
          .call('invalid', usdcAddress, 'nonExistentFunction')
          .execute()
      ).rejects.toThrow();
    }, 10000);

    it('should reject when using invalid contract address', async () => {
      const erc20Abi = ['function symbol() view returns (string)'];
      const invalidAddress = '0x0000000000000000000000000000000000000000';

      const multicaller = new Multicaller(network, provider, erc20Abi);

      await expect(
        multicaller.call('invalid', invalidAddress, 'symbol').execute()
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

      const multicaller = new Multicaller(
        polygonNetwork,
        polygonProvider,
        erc20Abi
      );

      const result = await multicaller
        .call('usdc.name', usdcPolygonAddress, 'name')
        .call('usdc.symbol', usdcPolygonAddress, 'symbol')
        .execute();

      expect(result.usdc.name).toBe('USD Coin');
      expect(result.usdc.symbol).toBe('USDC');
    }, 10000);
  });

  describe('state management', () => {
    it('should clear calls and paths after execution', async () => {
      const erc20Abi = ['function symbol() view returns (string)'];
      const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

      const multicaller = new Multicaller(network, provider, erc20Abi);

      // First execution
      const result1 = await multicaller
        .call('token1', usdcAddress, 'symbol')
        .execute();

      expect(result1.token1).toBe('USDC');
      expect(multicaller.calls).toHaveLength(0);
      expect(multicaller.paths).toHaveLength(0);

      // Second execution should work independently
      const result2 = await multicaller
        .call('token2', usdcAddress, 'symbol')
        .execute();

      expect(result2.token2).toBe('USDC');
      expect(result2.token1).toBeUndefined(); // Should not have previous data
    }, 10000);
  });
});
