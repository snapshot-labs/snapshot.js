// Inspired by https://github.com/snapshot-labs/snapshot.js/blob/master/src/strategies/uniswap/index.ts
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { subgraphRequest } from '../../utils';

export const author = 'ayush-jibrel';
export const version = '0.1.0';

const UNISWAP_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
};

const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address'
      }
    ],
    name: 'balanceOf',
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
  }
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const lpTokenAddress = options.lpTokenAddress.toLowerCase();

  const tokenAddress = options.tokenAddress.toLowerCase();

  var rate;

  const params = {
    pairs: {
      __args: {
        where: {
          id: lpTokenAddress
        }
      },
      id: true,
      totalSupply: true,
      reserve0: true,
      reserve1: true,
      token0: {
        id: true
      },
      token1: {
        id: true
      }
    }
  };

  const result = await subgraphRequest(UNISWAP_SUBGRAPH_URL[network], params);

  if (result && result.pairs) {
    result.pairs.map((object) => {
      rate =
        +object.token0.id == tokenAddress
          ? +object.reserve0 / +object.totalSupply
          : +object.reserve1 / +object.totalSupply;
    }, []);
  }

  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.address,
      'balanceOf',
      [address, lpTokenAddress]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals)) * rate
    ])
  );
}
