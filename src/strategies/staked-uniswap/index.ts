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
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const res = await multicall(
    network,
    provider,
    tokenAbi,
    [
      [options.uniswapAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [options.uniswapAddress]]
    ].concat(
      addresses.map((address: any) => [
        options.stakingAddress,
        'balanceOf',
        [address]
      ])
    ),
    { blockTag }
  );

  const totalSupply = res[0];
  const tokenBalanceInUni = res[1];
  const tokensPerUni =
    tokenBalanceInUni / 10 ** options.decimals / (totalSupply / 1e18);

  const response = res.slice(2);

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      (value / 10 ** options.decimals) * tokensPerUni
    ])
  );
}
