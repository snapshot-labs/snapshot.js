// Inspired by https://github.com/snapshot-labs/snapshot.js/blob/master/src/strategies/uniswap/index.ts
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

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

  let queryParam = `query {pairs (where: { id: "${lpTokenAddress}" }) {id totalSupply token0{id} token1{id} reserve0 reserve1 } }`;

  const tokenAddress = options.tokenAddress.toLowerCase();

  var rate;
  
  const result = await fetch(UNISWAP_SUBGRAPH_URL[network], {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: queryParam })
  });

  let { data } = await result.json();

  if (data && data.pairs) {
      data.pairs.map(async (object) => {
          rate = 
              +object.token0.id == tokenAddress
                ? (+object.reserve0 / +object.totalSupply)
                : (+object.reserve1 / +object.totalSupply);
      }, []);
  }

  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.address, 'balanceOf', [address, lpTokenAddress]]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      (parseFloat(formatUnits(value.toString(), options.decimals)) * rate)
    ])
  );
}
