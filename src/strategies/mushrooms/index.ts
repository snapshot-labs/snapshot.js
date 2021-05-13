import { formatUnits } from '@ethersproject/units';
import Multicaller from '../../utils/multicaller';

export const author = '@MushroomsFinan1';
export const version = '0.1.0';

const erc20Abi = [
  {
    inputs: [],
    name: 'totalSupply',
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
    stateMutability: 'view',
    type: 'function'
  }
];

const masterChefAbi = [
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
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'poolInfo',
    outputs: [
      {
        internalType: 'contract IERC20',
        name: 'lpToken',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'allocPoint',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'lastRewardBlock',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'accMMPerShare',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
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

  const masterChefMulti = new Multicaller(network, provider, masterChefAbi, {
    blockTag
  });
  addresses.forEach((address) => {
    masterChefMulti.call(
      `${address}.userInfo.amount`,
      options.masterchef,
      'userInfo',
      [options.pool, address]
    );
  });

  if (options.type === 'lp') {
    masterChefMulti.call('poolInfo.lpToken', options.masterchef, 'poolInfo', [
      options.pool
    ]);
    const masterChefResult = await masterChefMulti.execute();

    const erc20Multi = new Multicaller(network, provider, erc20Abi, {
      blockTag
    });
    erc20Multi.call(
      'lpTotalSupply',
      masterChefResult.poolInfo.lpToken,
      'totalSupply'
    );
    erc20Multi.call('poolMMBalance', options.govtoken, 'balanceOf', [
      masterChefResult.poolInfo.lpToken
    ]);
    const erc20Result = await erc20Multi.execute();

    return Object.fromEntries(
      addresses.map((address) => {
        return [
          address,
          parseFloat(
            formatUnits(
              masterChefResult[address].userInfo.amount
                .mul(erc20Result.poolMMBalance)
                .div(erc20Result.lpTotalSupply)
                .toString(),
              18
            )
          )
        ];
      })
    );
  } else {
    const masterChefResult = await masterChefMulti.execute();
    return Object.fromEntries(
      addresses.map((address) => {
        return [
          address,
          parseFloat(
            formatUnits(
              masterChefResult[address].userInfo.amount.toString(),
              18
            )
          )
        ];
      })
    );
  }
}
