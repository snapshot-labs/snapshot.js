import { formatUnits, parseUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { getBlockNumber } from '../../utils/web3';
import { multicall } from '../../utils';

export const author = 'bun919tw';
export const version = '0.2.0';

const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
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
    constant: true,
    inputs: [],
    name: 'exchangeRateStored',
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
        name: 'account',
        type: 'address'
      }
    ],
    name: 'borrowBalanceStored',
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
  const creamAddress = options.token;
  const blockTag =
    typeof snapshot === 'number' ? snapshot : await getBlockNumber(provider);
  let calls = [];
  for (let i = 0; i < options.weeks; i++) {
    // if block number < 0, uses blockTag
    const blocksPerWeek = 40320; // assume 15s per block
    const blockNumber = blockTag > 40320 * i ? blockTag - 40320 * i : blockTag;
    calls.push(
      creamBalanceOf(network, provider, addresses, options, blockNumber),
      creamSushiswapLP(network, provider, addresses, options, blockNumber),
      crCREAM(network, provider, addresses, options, blockNumber)
    );
  }

  const results = await Promise.all(calls);
  let score = results.reduce((balance, result) => {
    for (const [userAddress, userBalance] of Object.entries(result)) {
      balance[userAddress] = (balance[userAddress] || 0) + userBalance;
    }
    return balance;
  }, {});

  // get average balance of options.weeks
  for (const [userAddress, userBalance] of Object.entries(score)) {
    const balance: any = userBalance < 0 ? 0 : userBalance;
    score[userAddress] = balance / options.weeks;
  }

  return score;
}

async function creamBalanceOf(network, provider, addresses, options, snapshot) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const numPool = options.pools.length;
  const numAddress = addresses.length;

  const calls: any = [];
  for (let i = 0; i < numPool; i++) {
    calls.push(
      ...addresses.map((address) => [
        options.pools[i].address,
        'balanceOf',
        [address]
      ])
    );
  }

  const balances = await multicall(network, provider, abi, calls, {
    blockTag
  });

  return Object.fromEntries(
    addresses.map((address, i) => {
      let sum = 0;
      for (let j = 0; j < numPool; j++) {
        sum += parseFloat(
          formatUnits(balances[i + j * numAddress].toString(), 18)
        );
      }
      return [address, sum];
    })
  );
}

async function creamSushiswapLP(
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const response = await multicall(
    network,
    provider,
    abi,
    [
      [options.token, 'balanceOf', [options.sushiswap]],
      [options.sushiswap, 'totalSupply'],
      ...addresses.map((address: any) => [
        options.sushiswap,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.masterChef,
        'userInfo',
        [options.pid, address]
      ])
    ],
    { blockTag }
  );

  const creamPerLP = parseUnits(response[0][0].toString(), 18).div(
    response[1][0]
  );
  const lpBalances = response.slice(2, addresses.length + 2);
  const stakedUserInfo = response.slice(
    addresses.length + 2,
    addresses.length * 2 + 2
  );

  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const lpBalance = lpBalances[i][0].add(stakedUserInfo[i]['amount']);
        const creamLpBalance = lpBalance
          .mul(creamPerLP)
          .div(parseUnits('1', 18));

        return [addresses[i], parseFloat(formatUnits(creamLpBalance, 18))];
      })
  );
}

async function crCREAM(network, provider, addresses, options, snapshot) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const response = await multicall(
    network,
    provider,
    abi,
    [
      [options.crCREAM, 'exchangeRateStored'],
      ...addresses.map((address: any) => [
        options.crCREAM,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.crCREAM,
        'borrowBalanceStored',
        [address]
      ])
    ],
    { blockTag }
  );

  const exchangeRate = response[0][0];
  const crCREAMBalances = response.slice(1, addresses.length + 1);
  const borrowBalances = response.slice(
    addresses.length + 1,
    addresses.length * 2 + 1
  );

  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const supplyBalance = crCREAMBalances[i][0]
          .mul(exchangeRate)
          .div(parseUnits('1', 18));
        const lockedBalance = formatUnits(
          supplyBalance.sub(borrowBalances[i][0]),
          18
        );
        return [addresses[i], parseFloat(lockedBalance)];
      })
  );
}
