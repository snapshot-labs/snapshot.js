import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'my-swarm';
export const version = '0.1.0';

/*
 * Generic masterchef pool balance strategy. Accepted options:
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
    const uniReserve = values[2][0];
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
      options.uniPairAddress == null ? 1 : 3
    ).map((value, i) => [addresses[i], processValues(value, options)])
  );
}
