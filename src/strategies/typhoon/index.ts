import { formatUnits, parseUnits } from '@ethersproject/units';
import Multicaller from '../../utils/multicaller';

export const author = 'PencilDad';
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
  multi.call('micLP.phoon', options.token, 'balanceOf', [options.micLP]);
  multi.call('micLP.totalSupply', options.micLP, 'totalSupply');
  multi.call('usdtLP.phoon', options.token, 'balanceOf', [options.usdtLP]);
  multi.call('usdtLP.totalSupply', options.usdtLP, 'totalSupply');
  addresses.forEach((address) => {
    multi.call(`balance.${address}`, options.token, 'balanceOf', [address]);
    multi.call(`micLP.${address}.balance`, options.micLP, 'balanceOf', [
      address
    ]);
    multi.call(`micLP.${address}.staked`, options.micRewardPool, 'balanceOf', [
      address
    ]);
    multi.call(`usdtLP.${address}.balance`, options.usdtLP, 'balanceOf', [
      address
    ]);
    multi.call(
      `usdtLP.${address}.staked`,
      options.usdtRewardPool,
      'balanceOf',
      [address]
    );
  });
  const result = await multi.execute();

  const phoonPerMicLP = parseUnits(result.micLP.phoon.toString(), 18).div(
    result.micLP.totalSupply
  );
  const phoonPerUsdtLP = parseUnits(result.usdtLP.phoon.toString(), 18).div(
    result.usdtLP.totalSupply
  );

  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const micPhoon = result.micLP[addresses[i]].balance
          .add(result.micLP[addresses[i]].staked)
          .mul(phoonPerMicLP)
          .div(parseUnits('1', 18));
        const usdtPhoon = result.usdtLP[addresses[i]].balance
          .add(result.usdtLP[addresses[i]].staked)
          .mul(phoonPerUsdtLP)
          .div(parseUnits('1', 18));
        const score = result.balance[addresses[i]].add(micPhoon).add(usdtPhoon);
        return [addresses[i], parseFloat(formatUnits(score, 18))];
      })
  );
}
