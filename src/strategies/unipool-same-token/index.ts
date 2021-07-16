import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'dapplion';
export const version = '0.1.0';

// Merged ABIs from below contracts:
// * Unipool contract from @k06a: https://github.com/k06a/Unipool/blob/master/contracts/Unipool.sol
const contractAbi = [
  'function balanceOf(address account) view returns (uint256)',
  'function earned(address account) view returns (uint256)'
];

function bn(num: any): BigNumber {
  return BigNumber.from(num.toString());
}

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
    contractAbi,
    [
      ...addresses.map((address: any) => [
        options.unipoolAddress,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.unipoolAddress,
        'earned',
        [address]
      ])
    ],
    { blockTag }
  );

  // Balance of staked tokens in unipool contract per user
  const unipoolBalanceOf = res.slice(0, addresses.length).map((num) => {
    return bn(num); // decimal: 18
  });

  // Earned tokens from unipool contract per user
  const unipoolEarned = res.slice(addresses.length).map((num) => {
    return bn(num); // decimal: options.decimal
  });

  const sumList = unipoolBalanceOf.map((userBalanceOf, i) => {
    return userBalanceOf.add(unipoolEarned[i]);
  });

  return Object.fromEntries(
    sumList.map((sum, i) => {
      const parsedSum = parseFloat(formatUnits(sum, options.decimal));
      return [addresses[i], parsedSum];
    })
  );
}
