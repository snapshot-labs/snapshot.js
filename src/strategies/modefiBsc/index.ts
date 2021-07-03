import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'Modefi';
export const version = '0.0.1';
const MOD_POOL_ADDRESS = '0x84BA48ba794b357f0020d4e384549e75B2bC81f8';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
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

const stakingPoolAbi = [
	{
		inputs: [
			{
				internalType: 'address',
				name: "",
				type: 'address'
			}
		],
		name: '_stakers',
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
			},
			{
				internalType: 'uint256',
				name: 'distributed',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'staked',
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
  const balanceResponse = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
    { blockTag }
  );

  const stakeResponse = await multicall(
    network,
    provider,
    stakingPoolAbi,
    addresses.map((address: any) => [MOD_POOL_ADDRESS, '_stakers', [address]]),
    { blockTag }
  );

  return Object.fromEntries(
    balanceResponse.map((value, i) => {
      const balance1 = value[0];
      const balance2 = stakeResponse[i].amount;
      const sum = balance1.add(balance2);

      return [
        addresses[i],
        parseFloat(formatUnits(sum.toString(), options.decimals))
      ];
    })
  );
}
