import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { BigNumber} from '@ethersproject/bignumber';
import fetch from 'cross-fetch';
import { stringify } from 'ajv';

export const author = 'joaomajesus';
export const version = '0.1.0';

/*
 * Generic masterchef pool price strategy. Accepted options:
 * - chefAddress: masterchef contract address
 * - pid: mastechef pool id (starting with zero)
 * - uniPairAddress: address of a uniswap pair (or a sushi pair or any other with the same interface)
 *    - if the uniPairAddress option is provided, converts staked LP token balance to base token balance
 *      (based on the pair total supply and base token reserve)
 *    - if uniPairAddress is null or undefined, returns staked token balance of the pool
 * - weight: integer multiplier of the result (for combining strategies with different weights, totally optional)
 * - weightDecimals: integer value of number of decimal places to apply to the final result
 * - tokenAddress: address of a token in a single token poll. To be used instead of the uniPairAddress.
 *                 will only be used if uniPairAddress is not present.
 *                 can be used in conjunction with usePrice to get the price value of the staked tokens.
 * - token0Address: address of the uniPair token 0. If defined, the strategy will return the result for the token0.
 *                  can be used in conjunction with token1Address to get the sum of tokens or the UniPair token price
 *                  when used with usePrice and token1Address.
 *                  can be used with usePrice to get the price value of the staked amount of token0
 * - token0Weight: integer multiplier of the result for token0
 * - token0WeightDecimals: integer value of number of decimal places to apply to the result of token0
 * - token1Address: address of the uniPair token 1. If defined, the strategy will return the result for the token1.
 *                  can be used in conjunction with token0Address to get the sum of tokens or the UniPair token price
 *                  when used with usePrice and token0Address.
 *                  can be used with usePrice to get the price value of the staked amount of token1
 * - token1weight: integer multiplier of the result for token1
 * - token1WeightDecimal: integer value of number of decimal places to apply to the result of token1
 * - usePrice: boolean flag return the result in usd instead of token count
 * - log: boolean flag to enable or disable logging to the console (used for debugging purposes during development)
 *
 * Check the examples.json file for how to use the options.
 */

const abi = [
  // to get a user/pool balance from masterchef
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'userInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'rewardDebt',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  // to get info from uni pair
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      {
        internalType: 'uint112',
        name: '_reserve0',
        type: 'uint112'
      },
      {
        internalType: 'uint112',
        name: '_reserve1',
        type: 'uint112'
      },
      {
        internalType: 'uint32',
        name: '_blockTimestampLast',
        type: 'uint32'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'token0',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: "token1",
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
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
let log: String[] = [];

const getUserInfoCalls = (addresses: any[], options: any) => {
  const result: any[] = [];

  for (let address of addresses) {
    result.push([options.chefAddress, 'userInfo', [options.pid, address]]);
  }

  return result;
};

const getTokenCalls = (options: any) => {
  const result: any[] = [];

  if (options.uniPairAddress != null) {
    result.push([options.uniPairAddress, 'totalSupply', []]);
    result.push([options.uniPairAddress, 'getReserves', []]);
    result.push([options.uniPairAddress, 'token0', []]);
    result.push([options.uniPairAddress, 'token1', []]);
    result.push([options.uniPairAddress, 'decimals', []]);

    if(options.token0Address != null){
      result.push([options.token0Address, 'decimals', []]);
    }

    if(options.token1Address != null){
      result.push([options.token1Address, 'decimals', []]);
    }
  }

  if(options.tokenAddress != null){
    result.push([options.tokenAddress, 'decimals', []]);
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
  options: any,
  network: any,
  provider: any,
  blockTag: string | number) {

  log.push("values = " + values.toString());
  log.push("tokenValues = " + tokenValues.toString());
  printLog(options);

  const poolStaked = values[0][0] as BigNumber;
  const weight = BigNumber.from(options.weight || 1);
  const weightDecimals = BigNumber.from(10).pow(BigNumber.from(options.weightDecimals || 0));

  let result: number = 0;

  if (options.uniPairAddress == null) {
    const tokenAddress = options.tokenAddress;

    if(tokenAddress != null){
      const tokenDecimalsIndex: any = tokenAddress != null ? 5 : null;
      const tokenDecimals = tokenDecimalsIndex != null ? tokenValues[tokenDecimalsIndex][0] : 1;
      const price = await getTokenPrice(options, tokenAddress, network, provider, blockTag);

      log.push('poolStaked = ' + poolStaked);
      log.push('tokenDecimals = ' + tokenDecimals);
      log.push('price = ' + price);
      printLog(options);

      const tokenCount = poolStaked.div(tokenDecimals);

      result = toFloat(tokenCount, options.decimals) * price;
    }else{
      log.push('poolStaked = ' + poolStaked);
      printLog(options);

      result = toFloat(poolStaked, options.decimals);
    }
  } else {
    const uniTotalSupply = tokenValues[0][0];
    const uniReserve0 = tokenValues[1][0];
    const uniReserve1 = tokenValues[1][1];
    const uniPairDecimalsIndex: any = options.uniPairAddress != null ? 4 : null;
    const uniPairDecimalsCount = tokenValues[uniPairDecimalsIndex][0];
    const uniPairDecimals = uniPairDecimalsIndex != null ? BigNumber.from(10).pow(BigNumber.from(uniPairDecimalsCount || 0)) : BigNumber.from(1);

    const token0Address = tokenValues[2][0];
    const useToken0 = options.token0Address != null && options.token0Address.toString().toLowerCase() == token0Address?.toString().toLowerCase();

    log.push("useToken0 = " + useToken0);

    if(useToken0){
      const token0DecimalsIndex = options.token0Address == null
        ? null
        : options.tokenAddress != null
          ? 6
          : 5;

      result += await GetTokenValue(
        network,
        provider,
        blockTag,
        options,
        uniTotalSupply,
        uniReserve0,
        uniPairDecimals,
        poolStaked,
        tokenValues,
        token0Address,
        token0DecimalsIndex,
        options.Token0weight,
        options.token0WeightDecimals);
    }

    const token1Address = tokenValues[3][0];
    const useToken1 = options.token1Address != null && options.token1Address.toString().toLowerCase() == token1Address?.toString().toLowerCase();

    log.push("useToken1 = " + useToken1);

    if(useToken1){
      const token1DecimalsIndex = options.token1Address == null
        ? null
        : options.tokenAddress != null && options.token0Address != null
          ? 7
          : options.tokenAddress == null && options.token0Address != null
            ? 6
            : 5;

      result += (await GetTokenValue(
        network,
        provider,
        blockTag,
        options,
        uniTotalSupply,
        uniReserve1,
        uniPairDecimals,
        poolStaked,
        tokenValues,
        token1Address,
        token1DecimalsIndex,
        options.Token1weight,
        options.token1WeightDecimals));
    }

    if(!useToken0 && !useToken1){
      log.push('poolStaked = ' + poolStaked);
      log.push('uniPairDecimals = ' + uniPairDecimals);
      printLog(options);

      const tokenCount = poolStaked.toNumber() / (10**uniPairDecimalsCount);

      log.push('tokenCount = ' + tokenCount);

      result = tokenCount / (10**(options.decimals || 0));
    }
  }

  log.push('result = ' + result);
  printLog(options);

  result *= weight.toNumber()  / weightDecimals.toNumber();

  log.push('weight = ' + weight);
  log.push('weightDecimals = ' + weightDecimals);
  log.push('result = ' + result);
  printLog(options);

  return result;
}

function toFloat(tokenCount: BigNumber, decimals: any): number {
  return parseFloat(formatUnits(tokenCount.toString(), decimals || 18));
}

async function GetTokenValue(
  network: any,
  provider: any,
  blockTag: string | number,
  options: any,
  uniTotalSupply: any,
  uniReserve: any,
  uniPairDecimals: BigNumber,
  poolStaked: BigNumber,
  tokenValues: any[],
  tokenAddress: any,
  tokenDecimalsIndex: any,
  tokenWeight: any,
  tokenWeightDecimals: any) {
    const weightDecimals = BigNumber.from(10).pow(BigNumber.from(tokenWeightDecimals || 0));
    const weight = BigNumber.from(tokenWeight || 1);
    const tokensPerLp = uniReserve.mul(uniPairDecimals).div(uniTotalSupply);

    const tokenDecimals = tokenDecimalsIndex != null ? BigNumber.from(10).pow(BigNumber.from(tokenValues[tokenDecimalsIndex][0] || 0)) : BigNumber.from(1);
    const price = await getTokenPrice(options, tokenAddress, network, provider, blockTag);

    log.push('tokenAddress = ' + tokenAddress);
    log.push('tokenDecimals = ' + tokenDecimals);
    log.push('poolStaked = ' + poolStaked);
    log.push('uniReserve = ' + uniReserve);
    log.push('uniPairDecimals = ' + uniPairDecimals);
    log.push('uniTotalSupply = ' + uniTotalSupply);
    log.push('tokensPerLp = ' + tokensPerLp);
    log.push('tokenWeight = ' + weight);
    log.push('tokenWeightDecimals = ' + weightDecimals);
    log.push('price = ' + price);

    printLog(options);

    const tokenCount = poolStaked
      .mul(tokensPerLp)
      .div(tokenDecimals)
      .mul(weight)
      .div(weightDecimals);

    log.push('tokenCount = ' + tokenCount);

    return toFloat(tokenCount, options.decimals) * price;
}

function printLog(options){
  if(options.log || false)
  {
    console.debug(log);
    log = []
  }
}

async function getTokenPrice(options: any, tokenAddress: any, network: any, provider: any, blockTag: string | number) {
  let price: number = 1;
  const cacheKey = tokenAddress + blockTag;

  if (options.usePrice === true && !priceCache.has(cacheKey)) {
    log.push("calling getPrice for token address: "  + tokenAddress  + " and blockTag: " + blockTag);

     priceCache.set(cacheKey, await getPrice(network, provider, tokenAddress, blockTag) || 1);
  }

  price = priceCache.get(tokenAddress) || 1;

  return price;
}

async function getPrice(
  network,
  provider,
  address,
  blockTag) {

  if(!blockCache.has(blockTag)){
    blockCache.set(blockTag, await provider.getBlock(blockTag));
  }

  const block = blockCache.get(blockTag);
  const platform = networksWithPlatforms[network];
  const currency = 'usd'

  const coingeckoApiURL = `https://api.coingecko.com/api/v3/coins/${platform}/contract/${address}/market_chart/range?vs_currency=${currency}&from=${
    block.timestamp - 100000
  }&to=${block.timestamp}`;

  const coingeckoData = await fetch(coingeckoApiURL)
    .then(async (r) => {
      const json = await r.json();

      log.push("coingecko json = " + stringify(json));

      return json;
    })
    .catch((e) => {
      console.error(e);
      throw new Error('Strategy masterchef-pool-balance-of-token: coingecko api failed');
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
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const userInfoCalls = getUserInfoCalls(addresses, options);
  const tokenCalls = getTokenCalls(options);
  const entries = new Map<PropertyKey,any>();

  const userInfoResponse = await multicall(
    network,
    provider,
    abi,
    userInfoCalls,
    { blockTag }
  );

  const userInfoChunks = arrayChunk(
    userInfoResponse,
    1
  );

  const tokenResponse = await multicall(
    network,
    provider,
    abi,
    tokenCalls,
    { blockTag }
  );

  for (let i = 0; i < userInfoChunks.length; i++) {
    const value = userInfoChunks[i];
    const score = await processValues(value, tokenResponse, options, network, provider, blockTag)

    entries.set(addresses[i], score);
  }

  return Object.fromEntries(entries);
}
