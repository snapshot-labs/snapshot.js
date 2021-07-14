import { formatUnits } from '@ethersproject/units';
import { call, multicall } from '../../utils';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import fetch from 'cross-fetch';

export const author = 'joaomajesus';
export const version = '0.1.0';

/*
 * Generic masterchef pool price strategy. Accepted options:
 * - chefAddress: masterchef contract address
 * - pid: mastechef pool id (starting with zero)
 * - uniPairAddress: address of a uniswap pair (or a sushi pair or any other with the same interface)
 *    - if the uniPairAddress option is provided, converts staked LP token balance to base token balance
 *      (based on the pair total supply and base token reserve)
 *    - if uniPairAddress is null or undefined, returns staked token balance as is
 * - weight: integer multiplier of the result (for combining strategies with different weights, totally optional)
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
  // to get supply/reserve from uni pair
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
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
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

const priceCache: [any][number] = [];

let log: String[] = [];

// calls is a 1-dimensional array so we just push 3 calls for every address
const getCalls = (addresses: any[], options: any) => {
  const result: any[] = [];
  for (let address of addresses) {
    result.push([options.chefAddress, 'userInfo', [options.pid, address]]);

    if (options.uniPairAddress != null) {
      result.push([options.uniPairAddress, 'totalSupply', []]);
      result.push([options.uniPairAddress, 'getReserves', []]);
      result.push([options.uniPairAddress, 'token0', []]);
      result.push([options.uniPairAddress, 'token1', []]);
      result.push([options.uniPairAddress, 'decimals', []]);
    }

    if(options.tokenAddress != null){
      result.push([options.tokenAddress, 'decimals', []]);
    }

    if(options.token0Address != null){
      result.push([options.token0Address, 'decimals', []]);
    }

    if(options.token1Address != null){
      result.push([options.token1Address, 'decimals', []]);
    }
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

// values is an array of (chunked) call results for every input address
// for setups with uniPairAddress each chunk has 3 items, for setups without, only 1 item
async function processValues(
  values: any[],
  options: any,
  network: any,
  provider: any,
  blockTag: string | number) {

  log.push(values.toString());

  const poolStaked = values[0][0] as BigNumber;
  const weight = BigNumber.from(options.weight || 1);
  const weightDecimals = BigNumber.from(10).pow(BigNumber.from(options.tokenWeightDecimals || 0));

  let result: number = 0;

  if (options.uniPairAddress == null) {
    const tokenAddress = options.tokenAddress;

    if(tokenAddress != null){
      const tokenDecimalsIndex: any = options.tokenAddress != null ? 6 : null;
      const tokenDecimals = tokenDecimalsIndex != null ? values[tokenDecimalsIndex][0] : 1;
      const price = await getTokenPrice(options, tokenAddress, network, provider, blockTag);

      log.push('poolStaked = ' + poolStaked);
      log.push('tokenDecimals = ' + tokenDecimals);
      log.push('weight = ' + weight);
      log.push('weightDecimals = ' + weightDecimals);
      log.push('price = ' + price);

      printLog(options);

      const raw = poolStaked
            .div(tokenDecimals)
            .mul(weight)
            .div(weightDecimals);

      result = parseFloat(formatUnits(raw.toString(), options.decimals || 18)) * price;
    }else{
      log.push('poolStaked = ' + poolStaked);
      log.push('weight = ' + weight);
      log.push('weightDecimals = ' + weightDecimals);

      printLog(options);

      const raw = poolStaked
          .mul(weight)
          .div(weightDecimals);

      result = parseFloat(formatUnits(raw.toString(), options.decimals || 18));
    }
  } else {
    const uniTotalSupply = values[1][0];
    const uniReserve0 = values[2][0];
    const uniReserve1 = values[2][1];
    const uniPairDecimalsIndex: any = options.uniPairAddress != null ? 5 : null;
    const uniPairDecimals = uniPairDecimalsIndex != null ? BigNumber.from(10).pow(BigNumber.from(values[uniPairDecimalsIndex][0] || 0)) : BigNumber.from(1);

    const token0Address = values[3][0];
    const useToken0 = options.token0Address != null && options.token0Address.toString().toLowerCase() == token0Address?.toString().toLowerCase();

    log.push("useToken0 = " + useToken0);

    if(useToken0){
      const weight0 = BigNumber.from(options.Token0weight || 1);
      const weightDecimals0 = BigNumber.from(10).pow(BigNumber.from(options.token0WeightDecimals || 0));
      const tokensPerLp0 = uniReserve0.mul(uniPairDecimals).div(uniTotalSupply);

      const token0DecimalsIndex: any  = options.token0Address == null
        ? null
        : options.tokenAddress != null
          ? 7
          : 6;

      const token0Decimals = token0DecimalsIndex != null ? BigNumber.from(10).pow(BigNumber.from(values[token0DecimalsIndex][0] || 0)) : BigNumber.from(1);
      const price0 = await getTokenPrice(options, token0Address, network, provider, blockTag);

      log.push('token0Decimals = ' + token0Decimals);
      log.push('poolStaked = ' + poolStaked);
      log.push('uniReserve0 = ' + uniReserve0);
      log.push('uniPairDecimals = ' + uniPairDecimals);
      log.push('uniTotalSupply = ' + uniTotalSupply);
      log.push('tokensPerLp0 = ' + tokensPerLp0);
      log.push('weight0 = ' + weight0);
      log.push('weightDecimals0 = ' + weightDecimals0);
      log.push('price0 = ' + price0);

      printLog(options);

      const raw = poolStaked
            .mul(tokensPerLp0)
            .div(token0Decimals)
            .mul(weight0)
            .div(weightDecimals0);

      result += parseFloat(formatUnits(raw.toString(), options.decimals || 18)) * price0;
    }

    const token1Address = values[4][0];
    const useToken1 = options.token1Address != null && options.token1Address.toString().toLowerCase() == token1Address?.toString().toLowerCase();

    log.push("useToken1 = " + useToken1);

    if(useToken1){
      const weightDecimals1 = BigNumber.from(10).pow(BigNumber.from(options.token1WeightDecimals || 0));
      const weight1 = BigNumber.from(options.Token1weight || 1);
      const tokensPerLp1 = uniReserve1.mul(uniPairDecimals).div(uniTotalSupply);

      const token1DecimalsIndex : any = options.token1Address == null
        ? null
        : options.tokenAddress != null && options.token0Address != null
          ? 8
          : options.tokenAddress == null && options.token0Address != null
            ? 7
            : 6;

      const token1Decimals = token1DecimalsIndex != null ? BigNumber.from(10).pow(BigNumber.from(values[token1DecimalsIndex][0] || 0)) : BigNumber.from(1);
      const price1 = await getTokenPrice(options, token1Address, network, provider, blockTag);

      log.push('token1Decimals = ' + token1Decimals);
      log.push('poolStaked = ' + poolStaked);
      log.push('uniReserve1 = ' + uniReserve1);
      log.push('uniPairDecimals = ' + uniPairDecimals);
      log.push('uniTotalSupply = ' + uniTotalSupply);
      log.push('tokensPerLp1 = ' + tokensPerLp1);
      log.push('weight1 = ' + weight1);
      log.push('weightDecimals1 = ' + weightDecimals1);
      log.push('price1 = ' + price1);

      printLog(options);

      const raw = poolStaked
          .mul(tokensPerLp1)
          .div(token1Decimals)
          .mul(weight1)
          .div(weightDecimals1);

        result += parseFloat(formatUnits(raw.toString(), options.decimals || 18)) * price1;
    }

    if(!useToken0 && !useToken1){
      log.push('poolStaked = ' + poolStaked);
      log.push('uniPairDecimals = ' + uniPairDecimals);
      log.push('weight = ' + weight);
      log.push('weightDecimals = ' + weightDecimals);

      printLog(options);

      const raw = poolStaked
          .div(uniPairDecimals)
          .mul(weight)
          .div(weightDecimals);

      result = parseFloat(formatUnits(raw.toString(), options.decimals || 18));
    }
  }

  log.push('result = ' + result);

  printLog(options);
  return result;
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

  if (options.usePrice === true) {
    price = priceCache[tokenAddress] || 1;

    if (price == 1) {
      price = priceCache[tokenAddress] = await getPrice(network, provider, tokenAddress, blockTag) || 1;
    }
  }

  return price;
}

const blockCache: [any][any] = [];

async function getPrice(
  network,
  provider,
  address,
  blockTag) {
  const block = blockCache[blockTag] || (blockCache[blockTag] = await provider.getBlock(blockTag));
  const platform = networksWithPlatforms[network];
  const currency = 'usd'

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
      throw new Error('Strategy masterchef-pool-balance-of-token: coingecko api failed');
    });

  return coingeckoData.prices?.pop()?.pop() || 0;
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
  const calls = getCalls(addresses, options);
  const response = await multicall(
    network,
    provider,
    abi,
    calls,
    { blockTag }
  );

  const chunks = arrayChunk(
    response,
    calls.length
  );

  const entries: [any][number] = [];

  for (let i = 0; i < chunks.length; i++) {
    const value = chunks[i];
    const score = await processValues(value, options, network, provider, blockTag)

    entries.push([addresses[i], score]);
  }

  return Object.fromEntries(entries);
}
