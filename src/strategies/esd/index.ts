import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'lewi';
export const version = '0.1.0';

const abi = [
  {
    constant: true,
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOfBonded',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
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
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  // Fetch DAO Bonded tokens
  const daoBondedBalance = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.dao,
      'balanceOfBonded',
      [address]
    ]),
    { blockTag }
  );
  // Fetch LP Tokens
  const lpBonded = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.rewards,
      'balanceOfBonded',
      [address]
    ]),
    { blockTag }
  );
  // Fetch total ESD in Uniswap Pool and total UNI-V2 supply
  const [uniswapESD, uniswapTotalSupply] = await multicall(
    network,
    provider,
    abi,
    [
      [options.token, 'balanceOf', [options.uniswap]],
      [options.uniswap, 'totalSupply']
    ],
    { blockTag }
  );

  return Object.fromEntries(
    // Slightly complex 😅
    // 1. Create an empty array the length 'addresses'
    // 2. Loop through them
    // 3. Return address & value of bonded ESD in DAO & LP
    // 3a. Calc for ESD: (esdInUniswapPool / totalUniswapLPTokens * addressesLPTokens) + addressEsdInDao
    Array(addresses.length)
      .fill('x')
      .map((_, i) => [
        addresses[i],
        parseFloat(
          formatUnits(
            uniswapESD[0]
              .div(uniswapTotalSupply[0])
              .mul(lpBonded[i][0])
              .add(daoBondedBalance[i][0])
              .toString(),
            options.decimals
          )
        )
      ])
  );
}
