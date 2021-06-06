import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';

const BIG6 = BigNumber.from('1000000');
const BIG18 = BigNumber.from('1000000000000000000');

export const author = 'FraxFinance';
export const version = '0.0.2';

// 0.0.1: FXS Plus FXS in LPs
// 0.0.2: Adds veFXS and removes outdated SushiSwap LPs

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
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'boostedBalanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
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
    stateMutability: 'view',
    type: 'function',
    constant: true
  },
  {
    inputs: [],
    name: 'token0',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
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

  // Fetch veFXS Balance
  const vefxsQuery = addresses.map((address: any) => [
    options.VEFXS,
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
      ...fxsQuery,
      ...vefxsQuery,
      ...freeUniLPFraxFxsQuery,
      ...farmingUniLPFraxFxsQuery
    ],
    { blockTag }
  );

  const uniLPFraxFxs_token0 = response[0];
  const uniLPFraxFxs_getReserves = response[1];
  const uniLPFraxFxs_totalSupply = response[2];

  // Uniswap FRAX/FXS
  // ----------------------------------------
  let uniLPFraxFxs_fxs_per_LP_E18;
  let uni_FraxFxs_reservesFXS_E0;
  if (uniLPFraxFxs_token0[0] == options.FXS)
    uni_FraxFxs_reservesFXS_E0 = uniLPFraxFxs_getReserves[0];
  else uni_FraxFxs_reservesFXS_E0 = uniLPFraxFxs_getReserves[1];
  const uni_FraxFxs_totalSupply_E0 = uniLPFraxFxs_totalSupply[0];
  uniLPFraxFxs_fxs_per_LP_E18 = uni_FraxFxs_reservesFXS_E0
    .mul(BIG18)
    .div(uni_FraxFxs_totalSupply_E0);

  const responseClean = response.slice(3, response.length);

  const chunks = chunk(responseClean, addresses.length);
  const fxsBalances = chunks[0];
  const vefxsBalances = chunks[1];
  const freeUniFraxFxsBalances = chunks[2];
  const farmUniFraxFxsBalances = chunks[3];

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        const balances = [];
        const free_fxs = fxsBalances[i][0];
        const vefxs = vefxsBalances[i][0];
        const free_uni_frax_fxs = freeUniFraxFxsBalances[i][0];
        const farm_uni_frax_fxs = farmUniFraxFxsBalances[i][0];

        // Print statements
        // console.log(`==================${addresses[i]}==================`);
        // console.log("Free FXS: ", free_fxs.div(BIG18).toString());
        // console.log("veFXS: ", vefxs.div(BIG18).toString());
        // console.log("Free Uni FRAX/FXS LP: ", free_uni_frax_fxs.div(BIG18).toString());
        // console.log("Farmed Uni FRAX/FXS LP [boosted]: ", farm_uni_frax_fxs.div(BIG18).toString());
        // console.log("------");
        // console.log("E18");
        // console.log("FXS per Uni FRAX/FXS LP E18: ", uniLPFraxFxs_fxs_per_LP_E18.toString());
        // console.log("E0");
        // console.log("FXS per Uni FRAX/FXS LP E0: ", uniLPFraxFxs_fxs_per_LP_E18.div(BIG18).toString());
        // console.log(``);

        return [
          addresses[i],
          parseFloat(
            formatUnits(
              free_fxs
                .add(vefxs)
                .add(
                  free_uni_frax_fxs.mul(uniLPFraxFxs_fxs_per_LP_E18).div(BIG18)
                ) // FXS share in free Uni FRAX/FXS LP
                .add(
                  farm_uni_frax_fxs.mul(uniLPFraxFxs_fxs_per_LP_E18).div(BIG18)
                ) // FXS share in farmed Uni FRAX/FXS LP [boosted]
                .toString(),
              DECIMALS
            )
          )
        ];
      })
  );
}
