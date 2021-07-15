import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'tempofeng';
export const version = '0.1.0';

// Merged ABIs from below contracts:
// * BPool from Balancer-labs: https://github.com/balancer-labs/balancer-core/blob/master/contracts/BPool.sol
// * Unipool contract from @k06a: https://github.com/k06a/Unipool/blob/master/contracts/Unipool.sol
const contractAbi = [
  {
    constant: true,
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'earned',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'getBalance',
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

function bn(num: any): BigNumber {
  return BigNumber.from(num.toString());
}

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  let res = await multicall(
    network,
    provider,
    contractAbi,
    [
      [options.bpoolAddress, 'totalSupply', []],
      [options.bpoolAddress, 'getBalance', [options.tokenAddress]],
      ...addresses.map((address: any) => [
        options.unipoolAddress,
        'balanceOf',
        [address]
      ]),
      ...addresses.map((address: any) => [
        options.unipoolAddress,
        'earned',
        [address]
      ])
    ],
    { blockTag }
  );

  const totalBPTsInBPool = bn(res[0]); // decimal: 18
  const totalTokensInBPool = bn(res[1]); // decimal: options.decimal
  const tokensPerBPT = totalTokensInBPool.div(totalBPTsInBPool); // decimal: options.decimal / 18
  res = res.slice(2);

  // List how much tokens user have from their BPT tokens
  const userTokensFromBPTList = res.slice(0, addresses.length).map((num) => {
    const userBPTs = bn(num); // decimal: 18
    return userBPTs.mul(tokensPerBPT); // decimal: options.decimal
  });

  // List how much rewarded tokens user have in the unipool contract
  const userEarnedTokensList = res.slice(addresses.length).map((num) => {
    return bn(num); // decimal: options.decimal
  });

  const sumList = userTokensFromBPTList.map((userTokensFromBPT, i) => {
    return userTokensFromBPT.add(userEarnedTokensList[i]);
  });

  return Object.fromEntries(
    sumList.map((sum, i) => {
      const parsedSum = parseFloat(formatUnits(sum, options.decimal));
      return [addresses[i], parsedSum];
    })
  );
}
