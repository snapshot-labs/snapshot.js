import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import Multicaller from '../../utils/multicaller';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'planet-finance';
export const version = '0.0.1';

const planetFinanceFarmAbi = [
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'poolInfo',
    outputs: [
      { internalType: 'contract IERC20', name: 'want', type: 'address' },
      { internalType: 'uint256', name: 'allocPoint', type: 'uint256' },
      { internalType: 'uint256', name: 'lastRewardBlock', type: 'uint256' },
      { internalType: 'uint256', name: 'accAQUAPerShare', type: 'uint256' },
      { internalType: 'address', name: 'strat', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_pid', type: 'uint256' },
      { internalType: 'address', name: '_user', type: 'address' }
    ],
    name: 'stakedWantTokens',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export const bep20Abi: any = [
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

const planetFinanceFarmContractAddress =
  '0x0ac58Fd25f334975b1B61732CF79564b6200A933';

const aquaAddress = '0x72B7D61E8fC8cF971960DD9cfA59B8C829D91991';

const aquaBnbLpTokenAddress = '0x03028D2F8B275695A1c6AFB69A4765e3666e36d9';

const aquaCakeLpTokenAddress = '0x8852263275Ab21FfBAEB88a17BCb27611EeA54Ef';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const erc20Multi = new Multicaller(network, provider, bep20Abi, {
    blockTag
  });

  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const usersAquaVaultBalances = await multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      planetFinanceFarmContractAddress,
      'stakedWantTokens',
      ['1', address]
    ]),
    { blockTag }
  );

  let usersAquaBnbVaultBalances = await multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      planetFinanceFarmContractAddress,
      'stakedWantTokens',
      ['13', address]
    ]),
    { blockTag }
  );

  let usersAquaCakeVaultBalances = await multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      planetFinanceFarmContractAddress,
      'stakedWantTokens',
      ['14', address]
    ]),
    { blockTag }
  );

  erc20Multi.call('lpTotalSupply', aquaBnbLpTokenAddress, 'totalSupply');

  erc20Multi.call('poolMMBalance', aquaAddress, 'balanceOf', [
    aquaBnbLpTokenAddress
  ]);

  let erc20Result = await erc20Multi.execute();

  let totalSupply = erc20Result.lpTotalSupply.toString();

  let contractAquaBalance = erc20Result.poolMMBalance.toString();

  erc20Multi.call('lpTotalSupply', aquaCakeLpTokenAddress, 'totalSupply');

  erc20Multi.call('poolMMBalance', aquaAddress, 'balanceOf', [
    aquaCakeLpTokenAddress
  ]);

  erc20Result = await erc20Multi.execute();

  let totalSupplyAquaCake = erc20Result.lpTotalSupply.toString();

  let aquaCakeContractAquaBalance = erc20Result.poolMMBalance.toString();

  return Object.fromEntries(
    Object.entries(score).map((address, index) => [
      address[0],
      address[1] +
        parseFloat(formatUnits(usersAquaVaultBalances[index].toString(), 18)) +
        (parseFloat(
          formatUnits(usersAquaBnbVaultBalances[index].toString(), 18)
        ) /
          parseFloat(formatUnits(totalSupply, 18))) *
          parseFloat(formatUnits(contractAquaBalance, 18)) +
        (parseFloat(
          formatUnits(usersAquaCakeVaultBalances[index].toString(), 18)
        ) /
          parseFloat(formatUnits(totalSupplyAquaCake, 18))) *
          parseFloat(formatUnits(aquaCakeContractAquaBalance, 18))
    ])
  );
}
