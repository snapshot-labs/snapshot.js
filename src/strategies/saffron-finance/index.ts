import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';

export const author = 'saffron.finance';
export const version = '0.1.0';

const BIG6 = BigNumber.from('1000000');
const BIG18 = BigNumber.from('1000000000000000000');
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
        constant: true,
        inputs: [],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
];

const chunk = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );

/*
 TODO: Change this implementation to iterate through lists of configured contract addresses by type of vote scoring algorithm to apply.
 The intent is to remove the hard-coded behavior for each epoch's pool.

 For example, if the configuration property, params, has:

 {
    ...
    "params": {
        "oneToOne": [
            { "tokenAddress": "0xb753428af26e81097e7fd17f40c88aaa3e04902c" },
            { "tokenAddress": "0x4e5ee20900898054e998fd1862742c28c651bf5d" },
        ],
        "dexReserve": [
            {
              "dexLpAddress": "0xC76225124F3CaAb07f609b1D147a31de43926cd6",
              "saffronLpAddress": "0xF489fF098BFC862F09ec583c01bCFD2D4C43c589"
            },
            {
              "dexLpAddress": "0x23a9292830Fc80dB7f563eDb28D2fe6fB47f8624",
              "saffronLpAddress": "0x531B49EFd42775788f72a470a64E6b54d198f0be"
            },
            ...
        ],
        "aTrancheRatio": {
            "V1": [
                { "saffronPoolAddress": "0xf419345D943e49BBdb23dEE7c07A00BAC51D7Dde" },
                ...
            ],
            "V2: [
                { "saffronPoolAddress": "..." }
            ]
    }
    ...
 }

 */
export async function strategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
) {
    const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

    // Uniswap SFI/ETH LP SFI reserve
    const uniSfiEthReserveQuery = [ options.UNI_SFIETH_LP, 'getReserves' ];

    // Uniswap SFI/ETH LP Total Supply
    const uniSfiEthTotalSupplyQuery = [ options.UNI_SFIETH_LP, 'totalSupply' ];

    // Sushiswap SFI/ETH LP SFI reserve
    const sushiSfiEthReserveQuery = [ options.SUSHI_SFIETH_LP, 'getReserves' ];

    // Sushiswap SFI/ETH LP Total Supply
    const sushiSfiEthTotalSupplyQuery = [ options.SUSHI_SFIETH_LP, 'totalSupply' ];

    // SFI Balance
    const sfiQuery = addresses.map((address: any) => [
        options.SFI,
        'balanceOf',
        [address]
    ]);

    // Team HODL Balance
    const teamHodlQuery = addresses.map((address: any) => [
        options.TEAM_HODL_TOKEN,
        'balanceOf',
        [address]
    ])

    // Epoch 2 SFI Staking LP Principal
    const e2SfiStakLPQuery = addresses.map((address: any) => [
        options.E2_SFISTAK_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 2 SFI/ETH Uniswap LP Principal
    const e2SfiEthUniLPQuery = addresses.map((address: any) => [
        options.E2_SFIETH_UNI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 3 SFI Staking LP Principal
    const e3SfiStakLPQuery = addresses.map((address: any) => [
        options.E3_SFISTAK_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 3 SFI/ETH Uniswap LP Principal
    const e3SfiEthUniLPQuery = addresses.map((address: any) => [
        options.E3_SFIETH_UNI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 3 SFI/ETH Sushiswap LP Principal
    const e3SfiEthSushiLPQuery = addresses.map((address: any) => [
        options.E3_SFIETH_SUSHI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 4 SFI Staking LP Principal
    const e4SfiStakLPQuery = addresses.map((address: any) => [
        options.E4_SFISTAK_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 4 SFI/ETH Uniswap LP Principal
    const e4SfiEthUniLPQuery = addresses.map((address: any) => [
        options.E4_SFIETH_UNI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 4 SFI/ETH Sushiswap LP Principal
    const e4SfiEthSushiLPQuery = addresses.map((address: any) => [
        options.E4_SFIETH_SUSHI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 5 SFI Staking LP Principal
    const e5SfiStakLPQuery = addresses.map((address: any) => [
        options.E5_SFISTAK_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 5 SFI/ETH Uniswap LP Principal
    const e5SfiEthUniLPQuery = addresses.map((address: any) => [
        options.E5_SFIETH_UNI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 5 SFI/ETH Sushiswap LP Principal
    const e5SfiEthSushiLPQuery = addresses.map((address: any) => [
        options.E5_SFIETH_SUSHI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 6 SFI Staking LP Principal
    const e6SfiStakLPQuery = addresses.map((address: any) => [
        options.E6_SFISTAK_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 6 SFI/ETH Uniswap LP Principal
    const e6SfiEthUniLPQuery = addresses.map((address: any) => [
        options.E6_SFIETH_UNI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 6 SFI/ETH Sushiswap LP Principal
    const e6SfiEthSushiLPQuery = addresses.map((address: any) => [
        options.E6_SFIETH_SUSHI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 7 SFI Staking LP Principal
    const e7SfiStakLPQuery = addresses.map((address: any) => [
        options.E7_SFISTAK_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 7 SFI/ETH Uniswap LP Principal
    const e7SfiEthUniLPQuery = addresses.map((address: any) => [
        options.E7_SFIETH_UNI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 7 SFI/ETH Sushiswap LP Principal
    const e7SfiEthSushiLPQuery = addresses.map((address: any) => [
        options.E7_SFIETH_SUSHI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 8 SFI Staking LP Principal
    const e8SfiStakLPQuery = addresses.map((address: any) => [
        options.E8_SFISTAK_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 8 SFI/ETH Uniswap LP Principal
    const e8SfiEthUniLPQuery = addresses.map((address: any) => [
        options.E8_SFIETH_UNI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 8 SFI/ETH Sushiswap LP Principal
    const e8SfiEthSushiLPQuery = addresses.map((address: any) => [
        options.E8_SFIETH_SUSHI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 9 SFI Staking LP Principal
    const e9SfiStakLPQuery = addresses.map((address: any) => [
        options.E9_SFISTAK_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 9 SFI/ETH Uniswap LP Principal
    const e9SfiEthUniLPQuery = addresses.map((address: any) => [
        options.E9_SFIETH_UNI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 9 SFI/ETH Sushiswap LP Principal
    const e9SfiEthSushiLPQuery = addresses.map((address: any) => [
        options.E9_SFIETH_SUSHI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 10 SFI Staking LP Principal
    const e10SfiStakLPQuery = addresses.map((address: any) => [
        options.E10_SFISTAK_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 10 SFI/ETH Uniswap LP Principal
    const e10SfiEthUniLPQuery = addresses.map((address: any) => [
        options.E10_SFIETH_UNI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    // Epoch 10 SFI/ETH Sushiswap LP Principal
    const e10SfiEthSushiLPQuery = addresses.map((address: any) => [
        options.E10_SFIETH_SUSHI_LP_PRINCIPAL,
        'balanceOf',
        [address]
    ])

    console.log("===== multicall ======");
    const response1 = await multicall(
        network,
        provider,
        abi,
        [
            uniSfiEthReserveQuery,         // 0
            uniSfiEthTotalSupplyQuery,     // 1
            sushiSfiEthReserveQuery,       // 2
            sushiSfiEthTotalSupplyQuery,   // 3
            ...sfiQuery,                      // 4  0
            ...teamHodlQuery,                 // 5  1
            ...e2SfiStakLPQuery,              // 6  2
            ...e2SfiEthUniLPQuery,
            ...e3SfiStakLPQuery,
            ...e3SfiEthUniLPQuery,
            ...e3SfiEthSushiLPQuery,
            ...e4SfiStakLPQuery,
            ...e4SfiEthUniLPQuery,
            ...e4SfiEthSushiLPQuery,
            ...e5SfiStakLPQuery,
            ...e5SfiEthUniLPQuery,
            ...e5SfiEthSushiLPQuery,
            ...e6SfiStakLPQuery,
            ...e6SfiEthUniLPQuery,
            ...e6SfiEthSushiLPQuery,
            ...e7SfiStakLPQuery,
            ...e7SfiEthUniLPQuery,
            ...e7SfiEthSushiLPQuery,
        ],
        { blockTag }
    );

    const response2 = await multicall(
      network,
      provider,
      abi,
      [
            ...e8SfiStakLPQuery,
            ...e8SfiEthUniLPQuery,
            ...e8SfiEthSushiLPQuery,
            ...e9SfiStakLPQuery,
            ...e9SfiEthUniLPQuery,
            ...e9SfiEthSushiLPQuery,
            ...e10SfiStakLPQuery,
            ...e10SfiEthUniLPQuery,
            ...e10SfiEthSushiLPQuery,
        ]
    );

    const response = response1.concat(response2);
    const uniLpSfiReserve = response[0][0];
    const uniLpSfiEthTotalSupply = response[1][0];
    const sushiLpSfiReserve = response[2][0];
    const sushiLpSfiEthTotalSupply = response[3][0];

    const uniSaffLpToSFI_E18 = uniLpSfiReserve.mul(BIG18).div(uniLpSfiEthTotalSupply);
    const sushiSaffLpToSFI_E18 =  sushiLpSfiReserve.mul(BIG18).div(sushiLpSfiEthTotalSupply);

    console.log("uniLpSfiReserve", uniLpSfiReserve.toString());
    console.log("uniLpSfiEthTotalSupply", uniLpSfiEthTotalSupply.toString());
    console.log("sushiLpSfiReserve", sushiLpSfiReserve.toString());
    console.log("sushiLpSfiEthTotalSupply", sushiLpSfiEthTotalSupply.toString());
    console.log("uniSaffLpToSFI_E18", uniSaffLpToSFI_E18.toString());
    console.log("sushiSaffLpToSFI_E18", sushiSaffLpToSFI_E18.toString());

    const responseBalances = response.slice(4);
    const chunks = chunk(responseBalances, addresses.length);
    const sfiBalances = chunks[0];
    const sfiTeamHodlaBals = chunks[1];
    const e2SfiStakingBals = chunks[2];
    const e2SfiEthUniBals = chunks[3];
    const e3SfiStakingBals = chunks[4];
    const e3SfiEthUniBals = chunks[5];
    const e3SfiEthSushiBals = chunks[6];
    const e4SfiStakingBals = chunks[7];
    const e4SfiEthUniBals = chunks[8];
    const e4SfiEthSushiBals = chunks[9];
    const e5SfiStakingBals = chunks[10];
    const e5SfiEthUniBals = chunks[11];
    const e5SfiEthSushiBals = chunks[12];
    const e6SfiStakingBals = chunks[13];
    const e6SfiEthUniBals = chunks[14];
    const e6SfiEthSushiBals = chunks[15];
    const e7SfiStakingBals = chunks[16];
    const e7SfiEthUniBals = chunks[17];
    const e7SfiEthSushiBals = chunks[18];
    const e8SfiStakingBals = chunks[19];
    const e8SfiEthUniBals = chunks[20];
    const e8SfiEthSushiBals = chunks[21];
    const e9SfiStakingBals = chunks[22];
    const e9SfiEthUniBals = chunks[23];
    const e9SfiEthSushiBals = chunks[24];
    const e10SfiStakingBals = chunks[25];
    const e10SfiEthUniBals = chunks[26];
    const e10SfiEthSushiBals = chunks[27];

    console.log("==== Object.fromEntries =====");

    return Object.fromEntries(
        Array(addresses.length)
            .fill('sfi')
            .map((_, i) => {
              const sfi_bal = sfiBalances[i][0];
              const team_hodl_bal = sfiTeamHodlaBals[i][0];
              const e2_sfistak_bal = e2SfiStakingBals[i][0];
              const e2_sfiuni_bal = e2SfiEthUniBals[i][0];
              const e3_sfistak_bal = e3SfiStakingBals[i][0];
              const e3_sfiuni_bal = e3SfiEthUniBals[i][0];
              const e3_sfisushi_bal = e3SfiEthSushiBals[i][0];
              const e4_sfistak_bal = e4SfiStakingBals[i][0];
              const e4_sfiuni_bal = e4SfiEthUniBals[i][0];
              const e4_sfisushi_bal = e4SfiEthSushiBals[i][0];
              const e5_sfistak_bal = e5SfiStakingBals[i][0];
              const e5_sfiuni_bal = e5SfiEthUniBals[i][0];
              const e5_sfisushi_bal = e5SfiEthSushiBals[i][0];
              const e6_sfistak_bal = e6SfiStakingBals[i][0];
              const e6_sfiuni_bal = e6SfiEthUniBals[i][0];
              const e6_sfisushi_bal = e6SfiEthSushiBals[i][0];
              const e7_sfistak_bal = e7SfiStakingBals[i][0];
              const e7_sfiuni_bal = e7SfiEthUniBals[i][0];
              const e7_sfisushi_bal = e7SfiEthSushiBals[i][0];
              const e8_sfistak_bal = e8SfiStakingBals[i][0];
              const e8_sfiuni_bal = e8SfiEthUniBals[i][0];
              const e8_sfisushi_bal = e8SfiEthSushiBals[i][0];
              const e9_sfistak_bal = e9SfiStakingBals[i][0];
              const e9_sfiuni_bal = e9SfiEthUniBals[i][0];
              const e9_sfisushi_bal = e9SfiEthSushiBals[i][0];
              const e10_sfistak_bal = e10SfiStakingBals[i][0];
              const e10_sfiuni_bal = e10SfiEthUniBals[i][0];
              const e10_sfisushi_bal = e10SfiEthSushiBals[i][0];

              return [
                  addresses[i],
                  parseFloat(
                      formatUnits(
                          sfi_bal
                            .add(team_hodl_bal)
                            .add(e2_sfistak_bal)
                            .add(e2_sfiuni_bal.mul(uniSaffLpToSFI_E18).div(BIG18))
                            .add(e3_sfistak_bal)
                            .add(e3_sfiuni_bal.mul(uniSaffLpToSFI_E18).div(BIG18))
                            .add(e3_sfisushi_bal.mul(sushiSaffLpToSFI_E18).div(BIG18))
                            .add(e4_sfistak_bal)
                            .add(e4_sfiuni_bal.mul(uniSaffLpToSFI_E18).div(BIG18))
                            .add(e4_sfisushi_bal.mul(sushiSaffLpToSFI_E18).div(BIG18))
                            .add(e5_sfistak_bal)
                            .add(e5_sfiuni_bal.mul(uniSaffLpToSFI_E18).div(BIG18))
                            .add(e5_sfisushi_bal.mul(sushiSaffLpToSFI_E18).div(BIG18))
                            .add(e6_sfistak_bal)
                            .add(e6_sfiuni_bal.mul(uniSaffLpToSFI_E18).div(BIG18))
                            .add(e6_sfisushi_bal.mul(sushiSaffLpToSFI_E18).div(BIG18))
                            .add(e7_sfistak_bal)
                            .add(e7_sfiuni_bal.mul(uniSaffLpToSFI_E18).div(BIG18))
                            .add(e7_sfisushi_bal.mul(sushiSaffLpToSFI_E18).div(BIG18))
                            .add(e8_sfistak_bal)
                            .add(e8_sfiuni_bal.mul(uniSaffLpToSFI_E18).div(BIG18))
                            .add(e8_sfisushi_bal.mul(sushiSaffLpToSFI_E18).div(BIG18))
                            .add(e9_sfistak_bal)
                            .add(e9_sfiuni_bal.mul(uniSaffLpToSFI_E18).div(BIG18))
                            .add(e9_sfisushi_bal.mul(sushiSaffLpToSFI_E18).div(BIG18))
                            .add(e10_sfistak_bal)
                            .add(e10_sfiuni_bal.mul(uniSaffLpToSFI_E18).div(BIG18))
                            .add(e10_sfisushi_bal.mul(sushiSaffLpToSFI_E18).div(BIG18))
                          ,
                          DECIMALS
                      )
                  )
              ];
            })
    );
}
