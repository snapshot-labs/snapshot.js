import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';

const BIG6 = BigNumber.from('1000000');
const BIG18 = BigNumber.from('1000000000000000000');

const UNISWAP_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
};


export const author = 'FraxFinance';
export const version = '0.0.1';

const DECIMALS = 18;

const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
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
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "boostedBalanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      {
        "internalType": "uint112",
        "name": "_reserve0",
        "type": "uint112"
      },
      {
        "internalType": "uint112",
        "name": "_reserve1",
        "type": "uint112"
      },
      {
        "internalType": "uint32",
        "name": "_blockTimestampLast",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [],
    "name": "token0",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Fetch FXS Balance
  const fxsQuery = addresses.map((address: any) => [
    options.FXS,
    'balanceOf',
    [address]
  ]);

  // Fetch FREE_UNI_LP_FRAX_FXS Balance
  const freeUniLPFraxFxsQuery = addresses.map((address: any) => [
    options.UNI_LP_FRAX_FXS,
    'balanceOf',
    [address]
  ]);

  // Fetch FARMING_UNI_LP_FRAX_FXS Balance
  const farmingUniLPFraxFxsQuery = addresses.map((address: any) => [
    options.FARMING_UNI_LP_FRAX_FXS,
    'boostedBalanceOf',
    [address]
  ]);

  // Fetch FREE_SUSHI_LP_FRAX_FXS Balance
  const freeSushiLPFraxFxsQuery = addresses.map((address: any) => [
    options.SUSHI_LP_FRAX_FXS,
    'balanceOf',
    [address]
  ]);

  // Fetch FARMING_SUSHI_LP_FRAX_FXS Balance
  const farmingSushiLPFraxFxsQuery = addresses.map((address: any) => [
    options.FARMING_SUSHI_LP_FRAX_FXS,
    'boostedBalanceOf',
    [address]
  ]);

  // Fetch FREE_SUSHI_LP_FXS_WETH Balance
  const freeSushiLPFxsWethQuery = addresses.map((address: any) => [
    options.SUSHI_LP_FXS_WETH,
    'balanceOf',
    [address]
  ]);

  // Fetch FARMING_SUSHI_LP_FXS_WETH Balance
  const farmingSushiLPFxsWethQuery = addresses.map((address: any) => [
    options.FARMING_SUSHI_LP_FXS_WETH,
    'boostedBalanceOf',
    [address]
  ]);


  const response = await multicall(
    network,
    provider,
    abi,
    [
      // Get 1inch LP OPIUM-ETH balance of OPIUM
      // [options.OPIUM, 'balanceOf', [options.LP_1INCH_OPIUM_ETH]],
      [options.UNI_LP_FRAX_FXS, 'token0'],
      [options.UNI_LP_FRAX_FXS, 'getReserves'],
      [options.UNI_LP_FRAX_FXS, 'totalSupply'],
      [options.SUSHI_LP_FRAX_FXS, 'token0'],
      [options.SUSHI_LP_FRAX_FXS, 'getReserves'],
      [options.SUSHI_LP_FRAX_FXS, 'totalSupply'],
      [options.SUSHI_LP_FXS_WETH, 'token0'],
      [options.SUSHI_LP_FXS_WETH, 'getReserves'],
      [options.SUSHI_LP_FXS_WETH, 'totalSupply'],
      ...fxsQuery,
      ...freeUniLPFraxFxsQuery,
      ...farmingUniLPFraxFxsQuery,
      ...freeSushiLPFraxFxsQuery,
      ...farmingSushiLPFraxFxsQuery,
      ...freeSushiLPFxsWethQuery,
      ...farmingSushiLPFxsWethQuery,
    ],
    { blockTag }
  );


  const uniLPFraxFxs_token0 = response[0];
  const uniLPFraxFxs_getReserves = response[1];
  const uniLPFraxFxs_totalSupply = response[2];

  const sushiLPFraxFxs_token0 = response[3];
  const sushiLPFraxFxs_getReserves = response[4];
  const sushiLPFraxFxs_totalSupply = response[5];

  const sushiLPFxsWeth_token0 = response[6];
  const sushiLPFxsWeth_getReserves = response[7];
  const sushiLPFxsWeth_totalSupply = response[8];

  // Uniswap FRAX/FXS
  // ----------------------------------------
  let uniLPFraxFxs_fxs_per_LP_E18;
  let uni_FraxFxs_reservesFXS_E0;
  if (uniLPFraxFxs_token0[0] == options.FXS) uni_FraxFxs_reservesFXS_E0 = uniLPFraxFxs_getReserves[0];
  else uni_FraxFxs_reservesFXS_E0 = uniLPFraxFxs_getReserves[1]
  const uni_FraxFxs_totalSupply_E0 = uniLPFraxFxs_totalSupply[0];
  uniLPFraxFxs_fxs_per_LP_E18 = uni_FraxFxs_reservesFXS_E0.mul(BIG18).div(uni_FraxFxs_totalSupply_E0);

  // SushiSwap FRAX/FXS
  // ----------------------------------------
  let sushiLPFraxFxs_fxs_per_LP_E18;
  let sushi_FraxFxs_reservesFXS_E0;
  if (sushiLPFraxFxs_token0[0] == options.FXS) sushi_FraxFxs_reservesFXS_E0 = sushiLPFraxFxs_getReserves[0];
  else sushi_FraxFxs_reservesFXS_E0 = sushiLPFraxFxs_getReserves[1]
  const sushi_FraxFxs_totalSupply_E0 = sushiLPFraxFxs_totalSupply[0];
  sushiLPFraxFxs_fxs_per_LP_E18 = sushi_FraxFxs_reservesFXS_E0.mul(BIG18).div(sushi_FraxFxs_totalSupply_E0);

    // SushiSwap FXS/WETH
  // ----------------------------------------
  let sushiLPFxsWeth_fxs_per_LP_E18;
  let sushi_FxsWeth_reservesFXS_E0;
  if (sushiLPFxsWeth_token0[0] == options.FXS) sushi_FxsWeth_reservesFXS_E0 = sushiLPFxsWeth_getReserves[0];
  else sushi_FxsWeth_reservesFXS_E0 = sushiLPFxsWeth_getReserves[1]
  const sushi_FxsWeth_totalSupply_E0 = sushiLPFxsWeth_totalSupply[0];
  sushiLPFxsWeth_fxs_per_LP_E18 = sushi_FxsWeth_reservesFXS_E0.mul(BIG18).div(sushi_FxsWeth_totalSupply_E0);
 

  const responseClean = response.slice(9, response.length);

  const chunks = chunk(responseClean, addresses.length);
  const fxsBalances = chunks[0];
  const freeUniFraxFxsBalances = chunks[1];
  const farmUniFraxFxsBalances = chunks[2];
  const freeSushiFraxFxsBalances = chunks[3];
  const farmSushiFraxFxsBalances = chunks[4];
  const freeSushiFxsWethBalances = chunks[5];
  const farmSushiFxsWethBalances = chunks[6];

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        const balances = [];
        const free_fxs = fxsBalances[i][0];
        const free_uni_frax_fxs = freeUniFraxFxsBalances[i][0];
        const farm_uni_frax_fxs = farmUniFraxFxsBalances[i][0];
        const free_sushi_frax_fxs = freeSushiFraxFxsBalances[i][0];
        const farm_sushi_frax_fxs = farmSushiFraxFxsBalances[i][0];
        const free_sushi_fxs_weth = freeSushiFxsWethBalances[i][0];
        const farm_sushi_fxs_weth = farmSushiFxsWethBalances[i][0];

        // console.log(`==================${addresses[i]}==================`);
        // console.log("Free FXS: ", free_fxs.div(BIG18).toString());
        // console.log("Free Uni FRAX/FXS LP: ", free_uni_frax_fxs.div(BIG18).toString());
        // console.log("Farmed Uni FRAX/FXS LP [boosted]: ", farm_uni_frax_fxs.div(BIG18).toString());
        // console.log("Free Sushi FRAX/FXS LP: ", free_sushi_frax_fxs.div(BIG18).toString());
        // console.log("Farmed Sushi FRAX/FXS LP [boosted]: ", farm_sushi_frax_fxs.div(BIG18).toString());
        // console.log("Free Sushi FXS/WETH: ", free_sushi_fxs_weth.div(BIG18).toString());
        // console.log("Farmed Sushi FXS/WETH [boosted]: ", farm_sushi_fxs_weth.div(BIG18).toString());
        // console.log("------");
        // console.log("FXS per Uni FRAX/FXS LP: ", uniLPFraxFxs_fxs_per_LP_E18.toString());
        // console.log("FXS per Sushi FRAX/FXS LP: ", sushiLPFraxFxs_fxs_per_LP_E18.toString());
        // console.log("FXS per Sushi FXS/WETH LP: ", sushiLPFxsWeth_fxs_per_LP_E18.toString());
        // console.log(``);

        return [
          addresses[i],
          parseFloat(
            formatUnits(
              free_fxs
              .add((free_uni_frax_fxs).mul(uniLPFraxFxs_fxs_per_LP_E18).div(BIG18)) // FXS share in free Uni FRAX/FXS LP
              .add((farm_uni_frax_fxs).mul(uniLPFraxFxs_fxs_per_LP_E18).div(BIG18)) // FXS share in farmed Uni FRAX/FXS LP [boosted]
              .add((free_sushi_frax_fxs).mul(sushiLPFraxFxs_fxs_per_LP_E18).div(BIG18)) // FXS share in free Sushi FRAX/FXS LP
              .add((farm_sushi_frax_fxs).mul(sushiLPFraxFxs_fxs_per_LP_E18).div(BIG18)) // FXS share in farmed Sushi FRAX/FXS LP [boosted]
              .add((free_sushi_fxs_weth).mul(sushiLPFxsWeth_fxs_per_LP_E18).div(BIG18)) // FXS share in free Sushi FXS/WETH LP
              .add((farm_sushi_fxs_weth).mul(sushiLPFxsWeth_fxs_per_LP_E18).div(BIG18)) // FXS share in farmed Sushi FXS/WETH LP [boosted]
              
              .toString(),
              DECIMALS
            )
          )
        ]
      })
  );
}
