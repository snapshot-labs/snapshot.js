import fetch from 'cross-fetch';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'snapshot-labs';
export const version = '0.0.1';

const networksWithPlatforms = {
  1: 'ethereum',
  56: 'binance-smart-chain',
  66: 'okex-chain',
  88: 'tomochain',
  100: 'xdai',
  128: 'huobi-token',
  137: 'polygon-pos',
  250: 'fantom',
  42220: 'celo',
  43114: 'avalanche',
  1666600000: 'harmony-shard-0'
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const block = await provider.getBlock(blockTag);
  const platform = options.platform
    ? options.platform
    : networksWithPlatforms[network];
  const { address, currency = 'usd' } = options;
  const coingeckoApiURL = `https://api.coingecko.com/api/v3/coins/${platform}/contract/${address}/market_chart/range?vs_currency=${currency}&from=${
    block.timestamp - 100000
  }&to=${block.timestamp}`;
  const coingeckoData = await fetch(coingeckoApiURL)
    .then(async (r) => {
      const json = await r.json();
      return json;
    })
    .catch((e) => {
      console.error(e);
      throw new Error('Strategy er20-price: coingecko api failed');
    });

  const latestPriceFromBlock = coingeckoData.prices?.pop()?.pop() || 0;
  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  return Object.fromEntries(
    Object.entries(score).map((address: any) => [
      address[0],
      address[1] * latestPriceFromBlock
    ])
  );
}
