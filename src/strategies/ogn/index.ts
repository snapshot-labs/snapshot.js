import { formatUnits } from '@ethersproject/units';
import { getBlockNumber } from '../../utils/web3';
import { multicall } from '../../utils';

export const author = 'franckc';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  // Staking
  'function totalStaked(address account) external view returns (uint256)'
];

// Number of blocks in 30 days, assuming 15 sec per block.
const numBlock30Days = (30 * 24 * 60 * 60) / 15;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // If a specific block number is specified, use that.
  // Otherwise fetch the current block number from the network.
  const blockTag1 =
    typeof snapshot === 'number' ? snapshot : await getBlockNumber(provider);
  const blockTag2 = blockTag1 - numBlock30Days;

  // Compile a list of calls to make against the OGN and staking contracts.
  const ognCalls = addresses.map((address: any) => [
    options.ognAddress,
    'balanceOf',
    [address]
  ]);
  const stakingCalls = addresses.map((address: any) => [
    options.stakingAddress,
    'totalStaked',
    [address]
  ]);

  // Make calls to the OGN and staking contract to fetch balances.
  const multicalls = [
    multicall(network, provider, abi, ognCalls, { blockTag: blockTag1 }),
    multicall(network, provider, abi, ognCalls, { blockTag: blockTag2 }),
    multicall(network, provider, abi, stakingCalls, { blockTag: blockTag1 }),
    multicall(network, provider, abi, stakingCalls, { blockTag: blockTag2 })
  ];
  const responses = await Promise.all(multicalls);

  // Compute an average score.
  const scores = {};
  addresses.forEach((address, i) => {
    const balance = responses[0][i][0]
      .add(responses[1][i][0])
      .add(responses[2][i][0])
      .add(responses[3][i][0])
      .div(2);
    scores[address] = parseFloat(
      formatUnits(balance.toString(), options.decimals)
    );
  });

  return scores;
}
