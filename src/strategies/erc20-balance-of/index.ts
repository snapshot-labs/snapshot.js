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

  const increaceWeighting = (number, scalingFactor) => {
    return number * scalingFactor
  }

  // Duplicate array - We can make the multicall in one call for both contracts on all addresses
  addresses = [...addresses, ...addresses]

  let omStakingResponse = [];

  try {
    omStakingResponse = await multicall(
      network,
      provider,
      abi,
      addresses.map((address: any, i: any) => [
        (i < (addresses.length - addresses.length/2) - 1) ? options.omStakingAddress : options.omUniStakingAddress, 'balanceOf', [address]
      ]),
      { blockTag }
    );

    let om = (omStakingResponse.slice(0, addresses.length/2)).map((value, i) => [
      addresses[i],
      parseFloat(formatUnits((value).toString() , options.decimals))
    ])
  
    let uni = (omStakingResponse.slice(addresses.length/2, addresses.length)).map((value, i) => [
      addresses[i],
      parseFloat(formatUnits((value).toString() , options.decimals))
    ])

    uni.forEach((uniBalance, i) => {
      uni[i] = [uniBalance[0], (increaceWeighting(uni[i][1], options.omUniScalingFactor) + om[i][1])]
    });
    let combined = uni
    return {scores: Object.fromEntries(
      combined
    )};
    
  } catch (error) {
    console.log(error)
  }
  
  
}
