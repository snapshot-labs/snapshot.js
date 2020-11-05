import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'spaceforce-dev';
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

  let mergedAddresses = [...addresses, ...addresses]

  let omStakingResponse = [];
  try {
    omStakingResponse = await multicall(
      network,
      provider,
      abi,
      mergedAddresses.map((address: any, i: any) => [
        (i < (mergedAddresses.length - mergedAddresses.length/2) - 1) ? options.omStakingAddress : options.omUniStakingAddress, 'balanceOf', [address]
      ]),
      { blockTag }
    );
  } catch (error) {
    console.log(error)
  }

  try {

    let om = (omStakingResponse.slice(0, mergedAddresses.length/2)).map((value, i) => [
      mergedAddresses[i],
      parseFloat(formatUnits((value).toString() , options.decimals))
    ])
    let uni = (omStakingResponse.slice(mergedAddresses.length/2, mergedAddresses.length)).map((value, i) => [
      mergedAddresses[i],
      parseFloat(formatUnits((value).toString() , options.decimals))
    ])
  
    mergedAddresses.forEach((address, i) => {
      uni[i] = [address, 
        (increaceWeighting(uni[i][1], options.omUniScalingFactor) + om[i][1])]
    });
    let combined = uni
    return Object.fromEntries(
      combined
    );
    
  } catch (error) {
    console.log(error)
  }
  
  
}
