import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'lucid-eleven';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const thresholds = options.thresholds || [{ threshold: 1, votes: 1 }];
  if (thresholds.length == 0) thresholds.push({ threshold: 1, votes: 1 });

  const calculateVotes = (balance) =>
    thresholds
      .sort((a, b) => b.threshold - a.threshold)
      .find((t) => t.threshold <= balance)?.votes ?? 0;

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
    { blockTag }
  );

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      calculateVotes(
        parseFloat(formatUnits(value.toString(), options.decimals))
      )
    ])
  );
}
