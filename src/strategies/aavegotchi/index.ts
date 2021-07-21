import { multicall } from '../../utils';

export const author = 'vfatouros';
export const version = '0.1.0';

const tokenAbi = [
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
    inputs: [
      {
        internalType: 'address',
        name: '_account',
        type: 'address'
      }
    ],
    name: 'staked',
    outputs: [
      {
        internalType: 'uint256',
        name: 'ghst_',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'poolTokens_',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'ghstUsdcPoolToken_',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  options.ghstWethAddress =
    options.ghstWethAddress || '0xccb9d2100037f1253e6c1682adf7dc9944498aff';
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const res = await multicall(
    network,
    provider,
    tokenAbi,
    [
      [options.ghstQuickAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [options.ghstQuickAddress]],
      [options.ghstUsdcAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [options.ghstUsdcAddress]]
    ].concat(
      addresses.map((address: any) => [
        options.stakingAddress,
        'staked',
        [address]
      ])
    ),
    { blockTag }
  );

  const ghstQuickTotalSupply = res[0];
  const ghstQuickTokenBalanceInUni = res[1];
  const ghstQuickTokensPerUni =
    ghstQuickTokenBalanceInUni /
    10 ** options.decimals /
    (ghstQuickTotalSupply / 1e18);

  const ghstUsdcTotalSupply = res[2];
  const ghstUsdcTokenBalanceInUni = res[3];
  const ghstUsdcTokensPerUni =
    ghstUsdcTokenBalanceInUni /
    10 ** options.decimals /
    (ghstUsdcTotalSupply / 1e18);

  const response = res.slice(4);

  return Object.fromEntries(
    response.map((values, i) => [
      addresses[i],
      values[0] / 1e18 + //ghst_
        (values[1] / 10 ** options.decimals) * ghstQuickTokensPerUni + //poolTokens_
        (values[2] / 10 ** options.decimals) * ghstUsdcTokensPerUni //ghstUsdcPoolToken_
    ])
  );
}
