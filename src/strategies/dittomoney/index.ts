import { formatUnits, parseUnits } from '@ethersproject/units';
import Multicaller from '../../utils/multicaller';

export const author = 'codingsh';
export const version = '0.1.0';

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
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'addr',
        type: 'address'
      }
    ],
    name: 'totalStakedFor',
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

  const multi = new Multicaller(network, provider, abi, { blockTag });

  multi.call('pancakeBalance', options.token, 'balanceOf', [options.pancake]);
  multi.call('pancakeTotalSupply', options.pancake, 'totalSupply');
  addresses.forEach(address => {
    multi.call(`scores.${address}.totalStaked`, options.sharePool, 'totalStakedFor', [address]);
    multi.call(`scores.${address}.pancake`, options.pancake, 'balanceOf', [address]);
    multi.call(`scores.${address}.balance`, options.token, 'balanceOf', [address]);
  });


  const result = await multi.execute();

  const dittoPerLP = result.pancakeBalance;
  const lpBalances = result.scores[0].pancake;
  const stakedLpBalances = result.scores[0].totalStaked;
  const tokenBalances = result.scores[0].balance;


  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const lpBalance = lpBalances[i].add(stakedLpBalances[i]);
        const dittoLpBalance = lpBalance.mul(dittoPerLP).div(parseUnits('1', 18));

        return [
          addresses[i],
          parseFloat(
            formatUnits(
              dittoLpBalance[i]
                .add(tokenBalances[i]),
              options.decimals
            )
          )
        ];
      })
  );
}
