import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import Multicaller from '../../utils/multicaller';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'planet-finance';
export const version = '0.0.1';

const planetFinanceFarmAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'pid', type: 'uint256' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'Deposit',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'pid', type: 'uint256' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'EmergencyWithdraw',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'pid', type: 'uint256' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'Withdraw',
    type: 'event'
  },
  {
    inputs: [],
    name: 'AQUA',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'AQUAMaxSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'AQUAPerBlock',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_allocPoint', type: 'uint256' },
      { internalType: 'contract IERC20', name: '_want', type: 'address' },
      { internalType: 'bool', name: '_withUpdate', type: 'bool' },
      { internalType: 'address', name: '_strat', type: 'address' }
    ],
    name: 'add',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'burnAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '_newAddress', type: 'address' }],
    name: 'changeAQUAaddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_pid', type: 'uint256' },
      { internalType: 'uint256', name: '_wantAmt', type: 'uint256' }
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_pid', type: 'uint256' }],
    name: 'emergencyWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_from', type: 'uint256' },
      { internalType: 'uint256', name: '_to', type: 'uint256' }
    ],
    name: 'getMultiplier',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: '_token', type: 'address' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' }
    ],
    name: 'inCaseTokensGetStuck',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'massUpdatePools',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_pid', type: 'uint256' },
      { internalType: 'address', name: '_user', type: 'address' }
    ],
    name: 'pendingAQUA',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'poolInfo',
    outputs: [
      { internalType: 'contract IERC20', name: 'want', type: 'address' },
      { internalType: 'uint256', name: 'allocPoint', type: 'uint256' },
      { internalType: 'uint256', name: 'lastRewardBlock', type: 'uint256' },
      { internalType: 'uint256', name: 'accAQUAPerShare', type: 'uint256' },
      { internalType: 'address', name: 'strat', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'poolLength',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_pid', type: 'uint256' },
      { internalType: 'uint256', name: '_allocPoint', type: 'uint256' },
      { internalType: 'bool', name: '_withUpdate', type: 'bool' }
    ],
    name: 'set',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_pid', type: 'uint256' },
      { internalType: 'address', name: '_user', type: 'address' }
    ],
    name: 'stakedWantTokens',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'startBlock',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalAllocPoint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_pid', type: 'uint256' }],
    name: 'updatePool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'address', name: '', type: 'address' }
    ],
    name: 'userInfo',
    outputs: [
      { internalType: 'uint256', name: 'shares', type: 'uint256' },
      { internalType: 'uint256', name: 'rewardDebt', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_pid', type: 'uint256' },
      { internalType: 'uint256', name: '_wantAmt', type: 'uint256' }
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_pid', type: 'uint256' }],
    name: 'withdrawAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

export const bep20Abi: any = [
    { inputs: [], payable: false, stateMutability: 'nonpayable', type: 'constructor' },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
        { indexed: true, internalType: 'address', name: 'spender', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
      ],
      name: 'Approval',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' },
        { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' },
        { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      ],
      name: 'Burn',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' },
        { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' },
      ],
      name: 'Mint',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'amount0In', type: 'uint256' },
        { indexed: false, internalType: 'uint256', name: 'amount1In', type: 'uint256' },
        { indexed: false, internalType: 'uint256', name: 'amount0Out', type: 'uint256' },
        { indexed: false, internalType: 'uint256', name: 'amount1Out', type: 'uint256' },
        { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      ],
      name: 'Swap',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: false, internalType: 'uint112', name: 'reserve0', type: 'uint112' },
        { indexed: false, internalType: 'uint112', name: 'reserve1', type: 'uint112' },
      ],
      name: 'Sync',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'from', type: 'address' },
        { indexed: true, internalType: 'address', name: 'to', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
      ],
      name: 'Transfer',
      type: 'event',
    },
    {
      constant: true,
      inputs: [],
      name: 'DOMAIN_SEPARATOR',
      outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'MINIMUM_LIQUIDITY',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'PERMIT_TYPEHASH',
      outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [
        { internalType: 'address', name: '', type: 'address' },
        { internalType: 'address', name: '', type: 'address' },
      ],
      name: 'allowance',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { internalType: 'address', name: 'spender', type: 'address' },
        { internalType: 'uint256', name: 'value', type: 'uint256' },
      ],
      name: 'approve',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [{ internalType: 'address', name: '', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ internalType: 'address', name: 'to', type: 'address' }],
      name: 'burn',
      outputs: [
        { internalType: 'uint256', name: 'amount0', type: 'uint256' },
        { internalType: 'uint256', name: 'amount1', type: 'uint256' },
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'decimals',
      outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'factory',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'getReserves',
      outputs: [
        { internalType: 'uint112', name: '_reserve0', type: 'uint112' },
        { internalType: 'uint112', name: '_reserve1', type: 'uint112' },
        { internalType: 'uint32', name: '_blockTimestampLast', type: 'uint32' },
      ],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { internalType: 'address', name: '_token0', type: 'address' },
        { internalType: 'address', name: '_token1', type: 'address' },
      ],
      name: 'initialize',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'kLast',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ internalType: 'address', name: 'to', type: 'address' }],
      name: 'mint',
      outputs: [{ internalType: 'uint256', name: 'liquidity', type: 'uint256' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'name',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [{ internalType: 'address', name: '', type: 'address' }],
      name: 'nonces',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { internalType: 'address', name: 'owner', type: 'address' },
        { internalType: 'address', name: 'spender', type: 'address' },
        { internalType: 'uint256', name: 'value', type: 'uint256' },
        { internalType: 'uint256', name: 'deadline', type: 'uint256' },
        { internalType: 'uint8', name: 'v', type: 'uint8' },
        { internalType: 'bytes32', name: 'r', type: 'bytes32' },
        { internalType: 'bytes32', name: 's', type: 'bytes32' },
      ],
      name: 'permit',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'price0CumulativeLast',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'price1CumulativeLast',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [{ internalType: 'address', name: 'to', type: 'address' }],
      name: 'skim',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { internalType: 'uint256', name: 'amount0Out', type: 'uint256' },
        { internalType: 'uint256', name: 'amount1Out', type: 'uint256' },
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'bytes', name: 'data', type: 'bytes' },
      ],
      name: 'swap',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'symbol',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    { constant: false, inputs: [], name: 'sync', outputs: [], payable: false, stateMutability: 'nonpayable', type: 'function' },
    {
      constant: true,
      inputs: [],
      name: 'token0',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'token1',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'totalSupply',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'value', type: 'uint256' },
      ],
      name: 'transfer',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { internalType: 'address', name: 'from', type: 'address' },
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'value', type: 'uint256' },
      ],
      name: 'transferFrom',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]

const planetFinanceFarmContractAddress =
  '0x0ac58Fd25f334975b1B61732CF79564b6200A933';

const aquaAddress = '0x72B7D61E8fC8cF971960DD9cfA59B8C829D91991'

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const erc20Multi = new Multicaller(network, provider, bep20Abi, {
    blockTag
  });

  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const usersAquaVaultBalances = await multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      planetFinanceFarmContractAddress,
      'stakedWantTokens',
      ['1', address]
    ]),
    { blockTag }
  );
  
  let usersAquaBnbVaultBalances = await multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      planetFinanceFarmContractAddress,
      'stakedWantTokens',
      ['13', address]
    ]),
    { blockTag }
  );

  let aquaBnbPoolInfo = await multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      planetFinanceFarmContractAddress,
      'poolInfo',
      ['13']
    ]),
    { blockTag }
  );

  erc20Multi.call(
    'lpTotalSupply',
    aquaBnbPoolInfo[0][0],
    'totalSupply'
  );

  erc20Multi.call('poolMMBalance', aquaAddress , 'balanceOf', [
    aquaBnbPoolInfo[0][0]
  ]);

  let erc20Result = await erc20Multi.execute();

  let totalSupply = erc20Result.lpTotalSupply.toString();

  let contractAquaBalance = erc20Result.poolMMBalance.toString()

  let usersAquaCakeVaultBalances = await multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      planetFinanceFarmContractAddress,
      'stakedWantTokens',
      ['14', address]
    ]),
    { blockTag }
  );

  let aquaCakePoolInfo = await multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      planetFinanceFarmContractAddress,
      'poolInfo',
      ['14']
    ]),
    { blockTag }
  );

  erc20Multi.call(
    'lpTotalSupply',
    aquaCakePoolInfo[0][0],
    'totalSupply'
  );

  erc20Multi.call('poolMMBalance', aquaAddress , 'balanceOf', [
    aquaCakePoolInfo[0][0]
  ]);

  erc20Result = await erc20Multi.execute();

  let totalSupplyAquaCake = erc20Result.lpTotalSupply.toString();

  let aquaCakeContractAquaBalance = erc20Result.poolMMBalance.toString()
  

  return Object.fromEntries(
    Object.entries(score).map((address, index) => [
      address[0],
      address[1] +
      parseFloat(formatUnits(usersAquaVaultBalances[index].toString(),18))+
      ((parseFloat(formatUnits(usersAquaBnbVaultBalances[index].toString(), 18)) / parseFloat(formatUnits(totalSupply,18)))
      *(parseFloat(formatUnits(contractAquaBalance,18))))+
      ((parseFloat(formatUnits(usersAquaCakeVaultBalances[index].toString(), 18)) / parseFloat(formatUnits(totalSupplyAquaCake,18)))
      *(parseFloat(formatUnits(aquaCakeContractAquaBalance,18))))
    ])
  );
}
