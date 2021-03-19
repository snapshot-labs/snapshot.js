import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'crypto_pumpkin';
export const version = '0.1.0';

/**
 * Any standard xToken with `balanceOf` and `getShareValue` can use this strategy.
 */
const abi = [
  {
    constant: true,
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getShareValue',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  params,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const balanceCallParams = addresses.map((addr) => [
    params.tokenAddress,
    'balanceOf',
    [addr]
  ]);
  const res = await multicall(
    network,
    provider,
    abi,
    [[params.tokenAddress, 'getShareValue'], ...balanceCallParams],
    { blockTag }
  );
  const shareValue = res[0] / 1e18;
  const balances = res.slice(1);

  return Object.fromEntries(
    balances.map((balance, i) => [addresses[i], (balance * shareValue) / 1e18])
  );
}
