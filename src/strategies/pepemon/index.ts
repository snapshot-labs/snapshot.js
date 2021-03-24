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
    name: 'getAddressPpblzStakeAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: 'ppblz_',
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
    name: 'getAddressUniV2StakeAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: 'ppblzUni_',
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
        options.tokenAddress,
        'balanceOf',
        [address],
      ])).concat(
      addresses.map((address: any) => [
        options.stakingAddress,
        'getAddressPpblzStakeAmount',
        [address],
      ])).concat(
      addresses.map((address: any) => [
        options.uniswapAddress,
        'balanceOf',
        [address],
      ])).concat(
      addresses.map((address: any) => [
        options.stakingAddress,
        'getAddressUniV2StakeAmount',
        [address],
      ]))
    ,
    { blockTag }
  );

  const totalSupply = res[0];
  const tokenBalanceInUni = res[1];
  const tokensPerUni =
    tokenBalanceInUni / 10 ** options.decimals / (totalSupply / 1e18);
  const p1 = res.slice(2, 2+addresses.length);
  const p2 = res.slice(2+addresses.length, 2+addresses.length*2);
  const p3 = res.slice( 2+addresses.length*2, 2+addresses.length*3);
  const p4 = res.slice( 2+addresses.length*3, 2+addresses.length*4);
//p1 - token balances
//p2 - total ppblz staked
//p3 - univ2 balance
//p4 - total univ2 staked
  return Object.fromEntries(
    p1.map((values, i) => [
      addresses[i],
      //ppblz_, uniV2PoolTokens
      p1[i]/ 1e18 + p2[i]/1e18+ p3[i]/1e18 * tokensPerUni + p4[i]/1e18*tokensPerUni
    ])
  );
}
