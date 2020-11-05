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

  addresses = [...addresses, ...addresses]

  console.log(addresses)

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
  } catch (error) {
    console.log(error)
  }

  console.log(omStakingResponse)
  
  // const uniStakingResponse = await multicall(
  //   network,
  //   provider,
  //   abi,
  //   addresses.map((address: any) => [options.omUniStakingAddress, 'balanceOf', [address]]),
  //   { blockTag }
  // );

  try {

    let om = (omStakingResponse.slice(0, addresses.length/2)).map((value, i) => [
      addresses[i],
      parseFloat(formatUnits((value).toString() , options.decimals))
    ])
    let uni = (omStakingResponse.slice(addresses.length/2, addresses.length)).map((value, i) => [
      addresses[i],
      parseFloat(formatUnits((value).toString() , options.decimals))
    ])
  
    addresses.forEach((address, i) => {
      uni[i] = [address, 
        (increaceWeighting(uni[i][1], 4) + om[i][1])]
    });
    let combined = uni
    return {scores: Object.fromEntries(
      combined
    ), addresses: addresses, stakingResponse: omStakingResponse};
    
  } catch (error) {
    console.log(error)
  }
  
  
}
