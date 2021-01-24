import { formatUnits, parseUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

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

  const response = await multicall(
    network,
    provider,
    abi,
    [
      [options.token, 'balanceOf', [options.micLP]],
      [options.micLP, 'totalSupply'],
      [options.token, 'balanceOf', [options.usdtLP]],
      [options.usdtLP, 'totalSupply'],
      ...addresses.map((address: any) => [
        options.micLP,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.usdtLP,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.micRewardPool,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.usdtRewardPool,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.token,
        'balanceOf',
        [address]
      ])
    ],
    { blockTag }
  );

  const phoonPerMicLP = parseUnits(response[0][0].toString(), 18).div(
    response[1][0]
  );
  const phoonPerUsdtLP = parseUnits(response[2][0].toString(), 18).div(
    response[3][0]
  );
  const micLPBalances = response.slice(4, addresses.length + 4);
  const usdtLPBalances = response.slice(
    addresses.length + 4,
    addresses.length * 2 + 4
  );
  const micLPStakedBalances = response.slice(
    addresses.length * 2 + 4,
    addresses.length * 3 + 4
  );
  const usdtLPStakedBalances = response.slice(
    addresses.length * 3 + 4,
    addresses.length * 4 + 4
  );
  const tokenBalances = response.slice(
    addresses.length * 4 + 4,
    addresses.length * 5 + 4
  );

  return Object.fromEntries(
    tokenBalances.map((tokenBalance, i) => {
      const micLPBalance = micLPBalances[i][0].add(micLPStakedBalances[i][0]);
      const usdtLPBalance = usdtLPBalances[i][0].add(
        usdtLPStakedBalances[i][0]
      );
      const score = micLPBalance
        .mul(phoonPerMicLP)
        .add(usdtLPBalance.mul(phoonPerUsdtLP))
        .div(parseUnits('1', 18))
        .add(tokenBalance[0]);
      return [addresses[i], parseFloat(formatUnits(score, 18))];
    })
  );
}
