import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
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

const priceCache = {} ;

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
  network,
  provider,
  blockTag) {
  const poolStaked = values[0][0];

  const weight: BigNumber = BigNumber.from(options.weight || 1);
  const weight0: BigNumber = BigNumber.from(options.Token0weight || 1);
  const weight1: BigNumber = BigNumber.from(options.Token1weight || 1);

  const weightDecimals: BigNumber = BigNumber.from(10).pow(
    BigNumber.from(options.tokenWeightDecimals || 0)
  );

  const weightDecimals0: BigNumber = BigNumber.from(10).pow(
    BigNumber.from(options.token0WeightDecimals || 0)
  );

  const weightDecimals1: BigNumber = BigNumber.from(10).pow(
    BigNumber.from(options.token1WeightDecimals || 0)
  );

  let result:BigNumber;

  const uniPairDecimalsIndex: any = options.uniPairAddress != null ? 5 : null;
  const uniPairDecimals: BigNumber = BigNumber.from(10).pow(
    BigNumber.from(values[uniPairDecimalsIndex][0] || 0)
  );

  if (options.uniPairAddress == null) {
    const tokenAddress = options.tokenAddress;

    result = poolStaked
      .div(uniPairDecimals)
      .mul(weight)
      .div(weightDecimals);

    if(tokenAddress != null){
      const price = options.usePrice === true
        ? priceCache[tokenAddress] || (priceCache[tokenAddress] = await getPrice(network, provider, options, blockTag, tokenAddress))
        : 1;

      const tokenDecimalsIndex: any = options.tokenAddress != null ? 6 : null;
      const tokenDecimals = values[tokenDecimalsIndex][0];

      result = result.div(tokenDecimals).mul(price);
    }
  } else {
    const uniTotalSupply = values[1][0];
    const uniReserve0 = values[2][0];
    const uniReserve1 = values[2][1];

    const token0DecimalsIndex: any  = options.token0Address == null
      ? null
      : options.tokenAddress != null
        ? 7
        : 6;

    const token0Decimals: BigNumber = BigNumber.from(10).pow(
      BigNumber.from(values[token0DecimalsIndex][0] || 0)
    );

    const token1DecimalsIndex : any = options.token1Address == null
      ? null
      : options.tokenAddress != null && options.token0Address != null
        ? 8
        : options.tokenAddress == null && options.token0Address != null
          ? 7
          : 6;

    const token1Decimals: BigNumber = BigNumber.from(10).pow(
          BigNumber.from(values[token1DecimalsIndex][0] || 0)
        );

    result = BigNumber.from(0);

    const token0Address = values[3][0];

    if(options.token0Address != null && options.token0Address.toString().toLowerCase() == token0Address?.toString().toLowerCase()){
      const tokensPerLp0 = uniReserve0.mul(uniPairDecimals).div(uniTotalSupply);
      const price0 = options.usePrice === true
        ? priceCache[token0Address] || (priceCache[token0Address] = await getPrice(network, provider, options, blockTag, token0Address))
        : 1;

      result = result
        .add(poolStaked
          .mul(tokensPerLp0)
          .div(token0Decimals)
          .mul(weight0)
          .div(weightDecimals0)
          .mul(price0));
    }

    const token1Address = values[3][1];

    if(options.token1Address != null && options.token1Address.toString().toLowerCase() == token1Address?.toString().toLowerCase()){
      const tokensPerLp1 = uniReserve1.mul(uniPairDecimals).div(uniTotalSupply);
      const price1 = options.usePrice === true
        ? priceCache[token1Address] || (priceCache[token1Address] = await getPrice(network, provider, options, blockTag, token1Address))
        : 1;

      result = result
        .add(poolStaked
          .mul(tokensPerLp1)
          .div(token1Decimals)
          .mul(weight1)
          .div(weightDecimals1)
          .mul(price1));
    }
  }

  return parseFloat(formatUnits(result.toString(), options.decimals || 18));
}

async function getPrice(
  network,
  provider,
  options,
  address,
  blockTag) {
  const block = await provider.getBlock(blockTag);
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
  const response = await multicall(
    network,
    provider,
    abi,
    getCalls(addresses, options),
    { blockTag }
  );

  return Object.fromEntries(
    // chunk to response so that we can process values for each address
    arrayChunk(
      response,
      options.uniPairAddress != null && (options.token0Address != null || options.token1Address != null)
        ? 5
        : options.uniPairAddress != null
          ? 3
          : 1
    ).map((value, i) => [addresses[i], await processValues(value, options)])
  );
}



console.debug
