import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'andrew-frank';
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

const vrAbi = [
  {
    inputs: [
      { internalType: 'uint8', name: 'node', type: 'uint8' },
      { internalType: 'address', name: 'staker', type: 'address' }
    ],
    name: 'getStakerBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
]
const vr2Abi = vrAbi

const NUM_NODES = 10
const STAKES_MULTIPLIER = 2

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const nodesIdxs = Array.from(Array(NUM_NODES).keys())
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  async function getAvtStakeSum(_vrAbi: any, _vrAddress: any, _address: string ): Promise<BigNumber> {
    const stakes: BigNumber[] = await multicall(
      network,
      provider,
      _vrAbi,
      nodesIdxs.map((node: number) => [_vrAddress, 'getStakerBalance', [node, _address]]),
      { blockTag }
    );
    // sum values staked at all validators
    const sum = stakes.reduce((previus, current) => {
      return previus.add(current[0])
    }, BigNumber.from(0))
    return sum
  }

  // users AVTs 
  const avtResponses: Array<[BigNumber]> = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.tokenAddress, 'balanceOf', [address]]),
    { blockTag }
  );
  const avtValues = avtResponses.map(value => value[0])
  
  // users AVTs staked in VR contract
  const vr1SumsPromises: Array<Promise<BigNumber>> = addresses.map((addr: string) => getAvtStakeSum(vrAbi, options.vrAddress, addr))
  const vr1Sums = await Promise.all(vr1SumsPromises)
  // multiply values for staked AVTs
  const vr1Scores = vr1Sums.map(val => val.mul(STAKES_MULTIPLIER))

  // users AVTs staked in VR2 contract
  const vr2SumsPromises: Array<Promise<BigNumber>> = addresses.map((addr: string) => getAvtStakeSum(vr2Abi, options.vr2Address, addr))
  const vr2Sums = await Promise.all(vr2SumsPromises)
  // multiply values for staked AVTs
  const vr2Scores = vr2Sums.map(val => val.mul(STAKES_MULTIPLIER))

  // user score: AVTs + 2 * (AVT@VR + AVT@VR2)
  const scores = avtValues.map((value, i) => {
    return value.add(vr1Scores[i]).add(vr2Scores[i])
  })

  return Object.fromEntries(
    scores.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals))
    ]
  ))
}
