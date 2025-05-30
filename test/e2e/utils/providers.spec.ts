import { describe, expect, test } from 'vitest';
import getProvider, { getBatchedProvider } from '../../../src/utils/provider';

const starknetChainId = '0x534e5f5345504f4c4941';

describe('test providers', () => {
  test('should return a provider for EVM networks', async () => {
    expect(getProvider('1').getNetwork()).resolves.toEqual(
      expect.objectContaining({
        chainId: 1
      })
    );
  });

  test('should return a batch provider for EVM networks', async () => {
    const provider = getBatchedProvider('1');
    const requests = [provider.getNetwork(), provider.getBlockNumber()];

    expect(Promise.all(requests)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chainId: 1
        }),
        expect.any(Number)
      ])
    );
  });

  test('should return a provider for Starknet networks', async () => {
    expect(
      getProvider(starknetChainId, {
        broviderUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7'
      }).getChainId()
    ).resolves.toEqual(starknetChainId);
  });

  test('should return a batch provider for starknet networks', async () => {
    const provider = getBatchedProvider(starknetChainId, {
      broviderUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7'
    });
    const requests = [provider.getChainId(), provider.getBlockNumber()];

    expect(Promise.all(requests)).resolves.toEqual(
      expect.arrayContaining([starknetChainId, expect.any(Number)])
    );
  });
});
