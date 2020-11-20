import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as lpStrategy } from '../uniswap';
import { formatUnits } from "@ethersproject/units";

export const author = 'ncitron';
export const version = '0.0.1';

const stakingABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name :"earned",
    outputs: [
      {
        internalType :"uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability :"view",
    type: "function"
  }
]

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  //get erc20 token balance
  const balances = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  //get balances in LP pools
  const lpBalances = await lpStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  //get unclaimed token balance
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const unclaimed = await multicall(
    network,
    provider,
    stakingABI,
    addresses.map((address: any) => [options.stakingAddress, 'earned', [address]]),
    { blockTag }
  );

  //sum balance and unclaimed balance
  return Object.fromEntries(
    unclaimed.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals)) + balances[addresses[i]] + lpBalances[addresses[i]] || 0
    ])
  );
}
