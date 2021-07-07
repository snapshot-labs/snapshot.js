import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'joaomajesus';
export const version = '0.1.0';

/*
 * Generic masterchef pool balance of base token strategy. Accepted options:
 * - chefAddress: masterchef contract address
 * - pid: mastechef pool id (starting with zero)
 * - uniPairAddress: address of a uniswap pair (or a sushi pair or any other with the same interface)
 *    - if the uniPairAddress option is provided, converts staked LP token balance to base token balance
 *      (based on the pair total supply and base token reserve)
 *    - if uniPairAddress is null or undefined, returns staked token balance as is
 * - baseTokenAddress: address of a token
 *    - if the baseTokenAddress option is provided, converts staked LP token balance to tokenAddress token balance
 *      (based on the pair total supply and base token reserve)
 *    - if the baseTokenAddress is null or undefined, converts staked LP token balance to base token balance
 *      (based on the pair total supply and base token reserve)
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
  }
];

// calls is a 1-dimensional array so we just push 3 calls for every address
const getCalls = (addresses: any[], options: any) => {
  const result: any[] = [];
  for (let address of addresses) {
    result.push([options.chefAddress, 'userInfo', [options.pid, address]]);

    if (options.uniPairAddress != null) {
      result.push([options.uniPairAddress, 'totalSupply', []]);
      result.push([options.uniPairAddress, 'getReserves', []]);

      if (options.baseTokenAddress != null){
        result.push([options.uniPairAddress, 'token0', []]);
        result.push([options.uniPairAddress, 'token1', []]);
      }
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
function processValues(values: any[], options: any): number {
  const poolStaked = values[0][0];
  const weight: BigNumber = BigNumber.from(options.weight || 1);
  const weightDecimals: BigNumber = BigNumber.from(10).pow(
    BigNumber.from(options.weightDecimals || 0)
  );
  let result: BigNumber;
  if (options.uniPairAddress == null) {
    result = poolStaked.mul(weight).div(weightDecimals);
  } else {
    const uniTotalSupply = values[1][0];

    let tokenIndex: number = 0;

    console.debug('values[2] = ' + values[2]);
    console.debug('values[3][0] = ' + values[3][0]);
    console.debug('values[4][0] = ' + values[4][0]);
    console.debug('options.baseTokenAddress = ' + options.baseTokenAddress);

    if(options.baseTokenAddress != null && options.baseTokenAddress != undefined){
      console.debug('values[4][0].toString() == options.baseTokenAddress.toString() = ' + (values[4][0].toString() == options.baseTokenAddress.toString()).toString());

      tokenIndex = values[3][0].toString() == options.baseTokenAddress ? 0 : values[4][0].toString() == options.baseTokenAddress ? 1 : 0;
    }

    console.debug('tokenIndex = ' + tokenIndex)

    const uniReserve = values[2][tokenIndex];
    const precision = BigNumber.from(10).pow(18);
    const tokensPerLp = uniReserve.mul(precision).div(uniTotalSupply);
    result = poolStaked
      .mul(tokensPerLp)
      .mul(weight)
      .div(weightDecimals)
      .div(precision);
  }
  return parseFloat(formatUnits(result.toString(), options.decimals || 18));
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
      options.uniPairAddress != null && options.baseTokenAddress != null ? 5 : options.uniPairAddress != null ? 3 : 1
    ).map((value, i) => [addresses[i], processValues(value, options)])
  );
}
