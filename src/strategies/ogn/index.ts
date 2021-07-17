import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { getBlockNumber } from '../../utils/web3';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'Origin Protocol';
export const version = '0.1.0';

const abi = [
  // OGN, Uniswap, Sushiswap
  'function balanceOf(address account) external view returns (uint256)',
  // Staking
  'function totalStaked(address account) external view returns (uint256)',
  // Uniswap and Sushiswap
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() external view returns (uint)',
  // Balancer
  'function getBalance(address token) external view returns (uint256)',
  // Cream
  'function borrowBalanceStored(address account) external view returns (uint256)'
];

const secPerBlock = 15;

// Returns a list of block numbers to query at.
async function getBlockTags(provider, options) {
  const current = await getBlockNumber(provider);
  const tags = Array(options.numPeriods)
    .fill(null)
    .map((_, i) => {
      return current - i * options.blocksPerPeriod;
    });
  return tags;
}

function normalize(data, periods, decimals) {
  for (const key of Object.keys(data)) {
    const val = data[key].div(periods);
    data[key] = parseFloat(formatUnits(val.toString(), decimals));
  }
}

// Calculates scores on responses that include straight OGN balances.
// For example: ogn, staking, cream.
function getDirectScores(responses, index, addresses, options) {
  // For each address, add up the OGN balance from each period.
  const ognBalances = {};
  for (const response of responses) {
    const balances = response.slice(index, index + addresses.length);
    for (let i = 0; i < addresses.length; i++) {
      const address: string = addresses[i];
      const balance: BigNumber = balances[i][0];
      ognBalances[address] = ognBalances[address]
        ? ognBalances[address].add(balance)
        : balance;
    }
  }
  normalize(ognBalances, options.numPeriods, options.decimals);
  return ognBalances;
}

// Calculates scores on responses that include LP token balances, OGN reserve and total LP token supply.
// For example: uniswap, sushiswap, balancer.
function getLpTokenScores(responses, index, addresses, options) {
  const balancerBalances = {};
  for (const response of responses) {
    const ognReserve = response[index][0];
    const supply = response[index + 1][0];
    const balances = response.slice(index + 2, index + 2 + addresses.length);
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const ognBalance = balances[i][0].mul(ognReserve).div(supply);
      balancerBalances[address] = balancerBalances[address]
        ? balancerBalances[address].add(ognBalance)
        : ognBalance;
    }
  }
  normalize(balancerBalances, options.numPeriods, options.decimals);
  return balancerBalances;
}

// Compute a final score per address based on the intermediary scores.
function getFinalScores(scores, addresses) {
  //console.log("CALCULATING FINAL SCORES BASED ON SCORES", JSON.stringify(scores))
  const finalScores = {};
  for (const address of addresses) {
    finalScores[address] =
      scores.ogn[address] +
      scores.staking[address] +
      scores.uniswap[address] +
      scores.sushi[address] +
      scores.balancer[address] -
      scores.cream[address];
  }
  //console.log("FINALSCORES:", JSON.stringify(finalScores))
  return finalScores;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTags = await getBlockTags(provider, options);

  // Compile a list of calls to make to the various contracts in order to get all
  // the data we need in a single multicall.
  const ognCalls = addresses.map((address: any) => [
    options.ognAddress,
    'balanceOf',
    [address]
  ]);
  const stakeCalls = addresses.map((address: any) => [
    options.stakingAddress,
    'totalStaked',
    [address]
  ]);
  const uniswapCalls = [
    [options.uniswapV2EthOgnAddress, 'getReserves', []],
    [options.uniswapV2EthOgnAddress, 'totalSupply', []],
    ...addresses.map((address: any) => [
      options.uniswapV2EthOgnAddress,
      'balanceOf',
      [address]
    ])
  ];
  const sushiCalls = [
    [options.sushiswapEthOgnAddress, 'getReserves', []],
    [options.sushiswapEthOgnAddress, 'totalSupply', []],
    ...addresses.map((address: any) => [
      options.sushiswapEthOgnAddress,
      'balanceOf',
      [address]
    ])
  ];
  const balancerCalls = [
    [options.balancerEthOgnAddress, 'getBalance', [options.ognAddress]],
    [options.balancerEthOgnAddress, 'totalSupply', []],
    ...addresses.map((address: any) => [
      options.balancerEthOgnAddress,
      'balanceOf',
      [address]
    ])
  ];
  const creamCalls = [
    ...addresses.map((address: any) => [
      options.creamAddress,
      'borrowBalanceStored',
      [address]
    ])
  ];

  // Issue a multicall per block tag.
  const responses: any[] = [];
  for (const blockTag of blockTags) {
    const response = await multicall(
      network,
      provider,
      abi,
      [
        ...ognCalls,
        ...stakeCalls,
        ...uniswapCalls,
        ...sushiCalls,
        ...balancerCalls,
        ...creamCalls
      ],
      { blockTag }
    );
    responses.push(response);
  }

  // Compute scores for all the addresses based on the data collected on-chain.
  const l = addresses.length;
  const scores = {
    ogn: getDirectScores(responses, 0, addresses, options),
    staking: getDirectScores(responses, l, addresses, options),
    uniswap: getLpTokenScores(responses, 2 * l, addresses, options),
    sushi: getLpTokenScores(responses, 3 * l + 2, addresses, options),
    balancer: getLpTokenScores(responses, 4 * l + 4, addresses, options),
    cream: getDirectScores(responses, 5 * l + 6, addresses, options)
  };

  // Compute a final score per address.
  const finalScores = getFinalScores(scores, addresses);
  return finalScores;
}
