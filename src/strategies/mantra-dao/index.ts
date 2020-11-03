import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.0';

const abi = [
  {
    constant: true,
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
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const increaceWeighting = (number, increaceFactor) => {
    return number * increaceFactor
  }

  const omStakingResponse = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.omStakingAddress, 'balanceOf', [address]]),
    { blockTag }
  );
  const uniStakingResponse = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.omUniStakingAddress, 'balanceOf', [address]]),
    { blockTag }
  );
  
  let uni = uniStakingResponse.map((value, i) => [
    addresses[i],
    parseFloat(formatUnits((value).toString() , options.decimals))
  ])
  let om = omStakingResponse.map((value, i) => [
    addresses[i],
    parseFloat(formatUnits((value).toString() , options.decimals))
  ])

  addresses.forEach((address, i) => {
    uni[i] = [address, 
      (increaceWeighting(uni[i][1], 2) + om[i][1])]
  });
  let combined = uni
  return Object.fromEntries(
    combined
  );
}
