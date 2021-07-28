import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
import fetch from 'cross-fetch';

export const author = 'joaomajesus';
export const version = '0.2.0';

/*
 * Generic masterchef pool balance or price strategy. Accepted options:
 * - chefAddress: Masterchef contract address
 * - pid: Mastechef pool id (starting with zero)
 *
 * - uniPairAddress: Address of a uniswap pair (or a sushi pair or any other with the same interface)
 *    - If the uniPairAddress option is provided, converts staked LP token balance to base token balance
 *      (based on the pair total supply and base token reserve)
 *    - If uniPairAddress is null or undefined, returns staked token balance of the pool
 *
 * - tokenAddress: Address of a token for single token Pools.
 *    - if the uniPairAddress is provided the tokenAddress is ignored.
 *
 * - weight: Integer multiplier of the result (for combining strategies with different weights, totally optional)
 * - weightDecimals: Integer value of number of decimal places to apply to the final result
 *
 * - token0.address: Address of the uniPair token 0. If defined, the strategy will return the result for the token0.
 *                   can be used in conjunction with token1Address to get the sum of tokens or the UniPair token price
 *                   when used with usePrice and token1Address.
 *                   Can be used with usePrice to get the price value of the staked amount of token0
 * - token0.weight: Integer multiplier of the result for token0
 * - token0.weightDecimals: Integer value of number of decimal places to apply to the result of token0
 *
 * - token1.address: Address of the uniPair token 1. If defined, the strategy will return the result for the token1.
 *                   can be used in conjunction with token0Address to get the sum of tokens or the UniPair token price
 *                   when used with usePrice and token0Address.
 *                   can be used with usePrice to get the price value of the staked amount of token1
 * - token1,weight: Integer multiplier of the result for token1
 * - token1.weightDecimal: Integer value of number of decimal places to apply to the result of token1
 *
 * - usePrice: Boolean flag return the result in usd instead of token count
 *
 * - currency: currency for the price. (defaulted to 'usd').
 *
 * - log: Boolean flag to enable or disable logging to the console (used for debugging purposes during development)
 *
 * - antiWhale.enable: Boolean flag to apply an anti-whale measure reducing the effect on the voting power as the token amount increases.
 *    - if enabled will apply the the following to the result:
 *
 *      If result > antiWhale.threshold
 *        result = antiWhale.inflectionPoint * ( result / antiWhale.inflectionPoint ) ^ antiWhale.exponent
 *
 *      If result <= antiWhale.threshold
 *        thresholdMultiplier = ( antiWhale.inflectionPoint * ( antiWhale.threshold / antiWhale.inflectionPoint )^antiWhale.exponent ) / antiWhale.threshold
 *        result = result * thresholdMultiplier
 *
 *      - thresholdMultiplier: The multiplier at which all results below threshold are multiplied. This is ratio of antiWhale/result at the threshold point.
 * - antiWhale.threshold: Point at which antiWhale effect no longer applies. Results less than this will be treated with a static multiplier.
 *                        This is to reduce infinite incentive for multiple wallet exploits.
 *    - default: 1625.
 *    - lower cap: > 0 - set to default if <= 0.
 * - antiWhale.inflectionPoint: Point at which output matches result. Results less than this increase output. Results greater than this decrease output.
 *    - default: 6500.
 *    - lower cap: > 0 - set to default if <= 0.
 *    - must be >= antiWhale.threshold. Otherwise will be same as antiWhale.threshold.
 * - antiWhale.exponent: The exponent is responsible for the antiWhale effect. Must be less than one, or else it will have a pro-whale effect.
 *                       Must be greater than zero, or else it will cause total voting power to trend to zero.
 *    - default: 0.5.
 *    - upper cap: 1.
 *    - lower cap: > 0 - set to default if <= 0.
 *
 * Check the examples.json file for how to use the options.
 */

const abi = [
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)',
  'function totalSupply() view returns (uint256)',
  'function getReserves() view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function decimals() view returns (uint8)'
];

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

const priceCache = new Map<any, number>();
const blockCache = new Map<any, any>();
let log: string[] = [];
let _options;

const getUserInfoCalls = (addresses: any[]) => {
  const result: any[] = [];

  for (const address of addresses) {
    result.push([_options.chefAddress, 'userInfo', [_options.pid, address]]);
  }

  return result;
};

const getTokenCalls = () => {
  const result: any[] = [];

  if (_options.uniPairAddress != null) {
    result.push([_options.uniPairAddress, 'totalSupply', []]);
    result.push([_options.uniPairAddress, 'getReserves', []]);
    result.push([_options.uniPairAddress, 'token0', []]);
    result.push([_options.uniPairAddress, 'token1', []]);
    result.push([_options.uniPairAddress, 'decimals', []]);

    if (_options.token0?.address != null) {
      result.push([_options.token0.address, 'decimals', []]);
    }

    if (_options.token1?.address != null) {
      result.push([_options.token1.address, 'decimals', []]);
    }
  } else if (_options.tokenAddress != null) {
    result.push([_options.tokenAddress, 'decimals', []]);
  }

  return result;
};

function arrayChunk<T>(arr: T[], chunkSize: number): T[][] {
  const result: T[][] = [];

  for (let i = 0, j = arr.length; i < j; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }

  return result;
}

async function processValues(
  values: any[],
  tokenValues: any[],
  network: any,
  provider: any,
  blockTag: string | number
) {
  log.push(`values = ${JSON.stringify(values, undefined, 2)}`);
  log.push(`tokenValues = ${JSON.stringify(tokenValues, undefined, 2)}`);
  printLog();

  const poolStaked = values[0][0] as BigNumber;
  const weight = BigNumber.from(_options.weight || 1);
  const weightDecimals = BigNumber.from(10).pow(
    BigNumber.from(_options.weightDecimals || 0)
  );

  let result = 0;

  if (_options.uniPairAddress == null) {
    log.push(`poolStaked = ${poolStaked}`);

    if (_options.tokenAddress != null) {
      const tokenDecimals = BigNumber.from(10).pow(
        BigNumber.from(tokenValues[0][0])
      );

      log.push(`tokenDecimals = ${tokenDecimals}`);
      log.push(`decimals = ${_options.decimals}`);
      printLog();

      result = toFloat(poolStaked.div(tokenDecimals), _options.decimals);

      if (_options.usePrice == true) {
        const price = await getTokenPrice(
          _options.tokenAddress,
          network,
          provider,
          blockTag
        );

        result *= price;
      }
    } else {
      printLog();
      result = toFloat(poolStaked, _options.decimals);
    }
  } else {
    const uniTotalSupply = tokenValues[0][0];
    const uniReserve0 = tokenValues[1][0];
    const uniReserve1 = tokenValues[1][1];
    const uniPairDecimalsIndex: any =
      _options.uniPairAddress != null ? 4 : null;
    const uniPairDecimalsCount = tokenValues[uniPairDecimalsIndex][0];
    const uniPairDecimals =
      uniPairDecimalsIndex != null
        ? BigNumber.from(10).pow(BigNumber.from(uniPairDecimalsCount || 0))
        : BigNumber.from(1);

    const token0Address = tokenValues[2][0];
    const useToken0 =
      _options.token0?.address != null &&
      _options.token0.address.toString().toLowerCase() ==
        token0Address?.toString().toLowerCase();

    log.push(`useToken0 = ${useToken0}`);

    if (useToken0) {
      const token0DecimalsIndex = 5;

      log.push(`token0DecimalsIndex = ${token0DecimalsIndex}`);
      log.push(`tokenValues = ${JSON.stringify(tokenValues, undefined, 2)}`);
      printLog();

      result += await GetTokenValue(
        network,
        provider,
        blockTag,
        uniTotalSupply,
        uniReserve0,
        uniPairDecimals,
        poolStaked,
        tokenValues,
        token0Address,
        token0DecimalsIndex,
        _options.token0?.weight,
        _options.token0?.weightDecimals
      );
    }

    const token1Address = tokenValues[3][0];
    const useToken1 =
      _options.token1?.address != null &&
      _options.token1.address.toString().toLowerCase() ==
        token1Address?.toString().toLowerCase();

    log.push(`useToken1 = ${useToken1}`);

    if (useToken1) {
      const token1DecimalsIndex = _options.token0?.address != null ? 6 : 5;

      log.push(`token1DecimalsIndex = ${token1DecimalsIndex}`);
      log.push(`tokenValues = ${JSON.stringify(tokenValues, undefined, 2)}`);
      printLog();

      result += await GetTokenValue(
        network,
        provider,
        blockTag,
        uniTotalSupply,
        uniReserve1,
        uniPairDecimals,
        poolStaked,
        tokenValues,
        token1Address,
        token1DecimalsIndex,
        _options.token1?.weight,
        _options.token1?.WeightDecimals
      );
    }

    if (!useToken0 && !useToken1) {
      log.push(`poolStaked = ${poolStaked}`);
      log.push(`uniPairDecimals = ${uniPairDecimals}`);
      printLog();

      const tokenCount = poolStaked.toNumber() / 10 ** uniPairDecimalsCount;

      log.push(`tokenCount = ${tokenCount}`);

      result = tokenCount / 10 ** (_options.decimals || 0);
    }
  }

  log.push(`result = ${result}`);
  printLog();

  result *= weight.toNumber() / weightDecimals.toNumber();

  log.push(`weight = ${weight}`);
  log.push(`weightDecimals = ${weightDecimals}`);
  log.push(`result = ${result}`);
  printLog();

  return applyAntiWhaleMeasures(result);
}

function applyAntiWhaleMeasures(result) {
  log.push(`antiWhale = ${_options.antiWhale?.enable}`);

  if (_options.antiWhale?.enable != true) {
    printLog();
    return result;
  }

  const threshold =
    _options.antiWhale.threshold == null || _options.antiWhale.threshold <= 0
      ? 1625
      : _options.antiWhale.threshold;

  let inflectionPoint =
    _options.antiWhale.inflectionPoint == null ||
    _options.antiWhale.inflectionPoint <= 0
      ? 6500
      : _options.antiWhale.inflectionPoint;

  inflectionPoint = inflectionPoint < threshold ? threshold : inflectionPoint;

  const exponent =
    _options.antiWhale.exponent == null || _options.antiWhale.exponent <= 0
      ? 0.5
      : _options.antiWhale.exponent > 1
      ? 1
      : _options.antiWhale.exponent;

  log.push(`inflectionPoint = ${inflectionPoint}`);
  log.push(`exponent = ${exponent}`);
  log.push(`threshold = ${threshold}`);
  printLog();

  if (result > threshold) {
    result = inflectionPoint * (result / inflectionPoint) ** exponent;
  } else {
    const thresholdMultiplier =
      (inflectionPoint * (threshold / inflectionPoint) ** exponent) / threshold;

    log.push(`thresholdMultiplier = ${thresholdMultiplier}`);

    result = result * thresholdMultiplier;
  }

  log.push(`result = ${result}`);
  printLog();

  return result;
}

function toFloat(value: BigNumber, decimals: any): number {
  const decimalsResult = decimals === 0 ? 0 : decimals || 18;

  log.push(`toFloat value = ${value}`);
  log.push(`toFloat decimals = ${decimals}`);
  log.push(`toFloat decimalsResult = ${decimalsResult}`);
  printLog();

  return parseFloat(formatUnits(value.toString(), decimalsResult));
}

async function GetTokenValue(
  network: any,
  provider: any,
  blockTag: string | number,
  uniTotalSupply: any,
  uniReserve: any,
  uniPairDecimals: BigNumber,
  poolStaked: BigNumber,
  tokenValues: any[],
  tokenAddress: any,
  tokenDecimalsIndex: any,
  tokenWeight: any,
  tokenWeightDecimals: any
) {
  const weightDecimals = BigNumber.from(10).pow(
    BigNumber.from(tokenWeightDecimals || 0)
  );
  const weight = BigNumber.from(tokenWeight || 1);
  const tokensPerLp = uniReserve.mul(uniPairDecimals).div(uniTotalSupply);

  const tokenDecimals =
    tokenDecimalsIndex != null
      ? BigNumber.from(10).pow(
          BigNumber.from(tokenValues[tokenDecimalsIndex][0] || 0)
        )
      : BigNumber.from(1);
  const price = await getTokenPrice(tokenAddress, network, provider, blockTag);

  log.push(`tokenAddress = ${tokenAddress}`);
  log.push(`tokenDecimals = ${tokenDecimals}`);
  log.push(`poolStaked = ${poolStaked}`);
  log.push(`uniReserve = ${uniReserve}`);
  log.push(`uniPairDecimals = ${uniPairDecimals}`);
  log.push(`uniTotalSupply = ${uniTotalSupply}`);
  log.push(`tokensPerLp = ${tokensPerLp}`);
  log.push(`tokenWeight = ${weight}`);
  log.push(`tokenWeightDecimals = ${weightDecimals}`);
  log.push(`price = ${price}`);

  printLog();

  const tokenCount = poolStaked
    .mul(tokensPerLp)
    .div(tokenDecimals)
    .mul(weight)
    .div(weightDecimals);

  log.push(`tokenCount = ${tokenCount}`);

  return toFloat(tokenCount, _options.decimals) * price;
}

function printLog() {
  if (_options.log || false) {
    console.debug(log);
    log = [];
  }
}

async function getTokenPrice(
  tokenAddress: any,
  network: any,
  provider: any,
  blockTag: string | number
) {
  let price = 1;
  const cacheKey = tokenAddress + blockTag;

  if (_options.usePrice === true && !priceCache.has(cacheKey)) {
    log.push(
      `calling getPrice for token address: ${tokenAddress} and blockTag: ${blockTag}`
    );

    priceCache.set(
      cacheKey,
      (await getPrice(network, provider, tokenAddress, blockTag)) || 1
    );
  }

  price = priceCache.get(cacheKey) || 1;

  return price;
}

async function getPrice(network, provider, address, blockTag) {
  if (!blockCache.has(blockTag)) {
    blockCache.set(blockTag, await provider.getBlock(blockTag));
  }

  const block = blockCache.get(blockTag);
  const platform = networksWithPlatforms[network];
  const currency = _options.currency || 'usd';
  const from = block.timestamp - 100000;
  const to = block.timestamp;
  const coingeckoApiURL = `https://api.coingecko.com/api/v3/coins/${platform}/contract/${new String(
    address
  ).toLowerCase()}/market_chart/range?vs_currency=${currency}&from=${from}&to=${to}`;

  log.push(`platform = ${platform}`);
  log.push(`from = ${from}`);
  log.push(`to = ${from}`);
  log.push(`coingeckoApiURL = ${coingeckoApiURL}`);

  const coingeckoData = await fetch(coingeckoApiURL)
    .then(async (r) => {
      log.push(`coingeco response = ${JSON.stringify(r, undefined, 2)}`);

      const json = await r.json();

      log.push(`coingecko json = ${JSON.stringify(json, undefined, 2)}`);

      return json;
    })
    .catch((e) => {
      console.error(e);
      throw new Error(
        'Strategy masterchef-pool-balance-of-token: coingecko api failed'
      );
    });

  return (coingeckoData.prices?.pop()?.pop() || 0) as number;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  _options = options;
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const userInfoCalls = getUserInfoCalls(addresses);
  const tokenCalls = getTokenCalls();
  const entries = new Map<PropertyKey, any>();

  const userInfoResponse = await multicall(
    network,
    provider,
    abi,
    userInfoCalls,
    { blockTag }
  );

  const userInfoChunks = arrayChunk(userInfoResponse, 1);

  const tokenResponse = await multicall(network, provider, abi, tokenCalls, {
    blockTag
  });

  for (let i = 0; i < userInfoChunks.length; i++) {
    const value = userInfoChunks[i];
    const score = await processValues(
      value,
      tokenResponse,
      network,
      provider,
      blockTag
    );

    entries.set(addresses[i], score);
  }

  return Object.fromEntries(entries);
}
