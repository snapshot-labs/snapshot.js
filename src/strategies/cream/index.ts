import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { getBlockNumber } from '../../utils/web3';
import Multicaller from '../../utils/multicaller';

export const author = 'bun919tw';
export const version = '0.2.0';

const ONE_E18 = parseUnits('1', 18);

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
  const snapshotBlock =
    typeof snapshot === 'number' ? snapshot : await getBlockNumber(provider);
  let snapshotBlocks: number[] = [];

  for (let i = 0; i < options.weeks; i++) {
    const blocksPerWeek = 40320; // assume 15s per block
    let blockTag =
      snapshotBlock > blocksPerWeek * i
        ? snapshotBlock - blocksPerWeek * i
        : snapshotBlock;
    snapshotBlocks.push(blockTag);
  }

  const scores = await Promise.all([
    ...snapshotBlocks.map((blockTag) =>
      getScores(provider, addresses, options, blockTag)
    )
  ]);

  let averageScore = {};
  addresses.forEach((address) => {
    const userScore = scores
      .map((score) => score[address])
      .reduce(
        (accumulator, score) => accumulator.add(score),
        BigNumber.from(0)
      );
    averageScore[address] = userScore.div(options.weeks);
  });

  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const score = formatUnits(averageScore[addresses[i]], 18);
        // ignore score < minimum voting amount
        if (score < options.minVote) {
          return [addresses[i], 0];
        }
        return [addresses[i], parseFloat(score)];
      })
  );
}

async function getScores(provider, addresses, options, blockTag) {
  let score = {};
  // Ethereum only
  const multi = new Multicaller('1', provider, abi, { blockTag });
  multi.call('sushiswap.cream', options.token, 'balanceOf', [
    options.sushiswap
  ]);
  multi.call('sushiswap.totalSupply', options.sushiswap, 'totalSupply');
  multi.call('uniswap.cream', options.token, 'balanceOf', [options.uniswap]);
  multi.call('uniswap.totalSupply', options.uniswap, 'totalSupply');
  multi.call('balancer.cream', options.token, 'balanceOf', [options.balancer]);
  multi.call('balancer.totalSupply', options.balancer, 'totalSupply');
  multi.call('crCREAM.exchangeRate', options.crCREAM, 'exchangeRateStored');

  addresses.forEach((address) => {
    multi.call(
      `sushiswap.${address}.balanceOf`,
      options.sushiswap,
      'balanceOf',
      [address]
    );
    multi.call(
      `sushiswap.${address}.userInfo`,
      options.masterChef,
      'userInfo',
      [options.pid, address]
    );
    multi.call(`uniswap.${address}.balanceOf`, options.uniswap, 'balanceOf', [
      address
    ]);
    multi.call(`balancer.${address}.balanceOf`, options.balancer, 'balanceOf', [
      address
    ]);
    multi.call(`crCREAM.${address}.balanceOf`, options.crCREAM, 'balanceOf', [
      address
    ]);
    multi.call(
      `crCREAM.${address}.borrow`,
      options.crCREAM,
      'borrowBalanceStored',
      [address]
    );

    options.pools.forEach((pool) => {
      multi.call(`pool.${address}.${pool.name}`, pool.address, 'balanceOf', [
        address
      ]);
    });
  });

  const result = await multi.execute();

  const creamPerSushiswapLP = parseUnits(
    result.sushiswap.cream.toString(),
    18
  ).div(result.sushiswap.totalSupply);
  const creamPerUniswapLP = parseUnits(result.uniswap.cream.toString(), 18).div(
    result.uniswap.totalSupply
  );
  const creamPerBalancerLP = parseUnits(
    result.balancer.cream.toString(),
    18
  ).div(result.balancer.totalSupply);

  addresses.forEach((address) => {
    const userScore = score[address] || BigNumber.from(0);
    const sushi = result.sushiswap[address].balanceOf
      .add(result.sushiswap[address].userInfo)
      .mul(creamPerSushiswapLP)
      .div(ONE_E18);
    const uniswap = result.uniswap[address].balanceOf
      .mul(creamPerUniswapLP)
      .div(ONE_E18);
    const balancer = result.balancer[address].balanceOf
      .mul(creamPerBalancerLP)
      .div(ONE_E18);
    const crCREAM = result.crCREAM[address].balanceOf
      .mul(result.crCREAM.exchangeRate)
      .div(ONE_E18)
      .sub(result.crCREAM[address].borrow);
    const pools = Object.values(result.pool[address]).reduce(
      (accumulator: any, poolBalance: any) => {
        return accumulator.add(poolBalance);
      },
      BigNumber.from(0)
    );

    score[address] = userScore
      .add(sushi)
      .add(uniswap)
      .add(balancer)
      .add(crCREAM)
      .add(pools);
  });

  return score;
}
