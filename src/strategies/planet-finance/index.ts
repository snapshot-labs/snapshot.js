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

const aquaBusdLpTokenAddress = '0x0DcFde6c6761286AE0FF26abE65c30c8918889Ca';

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
  // returns user's aqua balance ofr their address
  let score: any = erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  // returns user's aqua balance in aqua only vault
  let usersAquaVaultBalances: any = multicall(
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

  // returns user's aqua balance in aqua-bnb vault
  let usersAquaBnbVaultBalances: any = multicall(
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

  // returns user's aqua balance in aqua-cake vault
  let usersAquaCakeVaultBalances: any = multicall(
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

  // returns user's aqua balance in aqua-busd vault
  let usersAquaBusdVaultBalances: any = multicall(
    network,
    provider,
    planetFinanceFarmAbi,
    addresses.map((address: any) => [
      planetFinanceFarmContractAddress,
      'stakedWantTokens',
      ['36', address]
    ]),
    { blockTag }
  );

  const result = await Promise.all([
    score,
    usersAquaVaultBalances,
    usersAquaBnbVaultBalances,
    usersAquaCakeVaultBalances,
    usersAquaBusdVaultBalances
  ]);

  score = result[0];
  usersAquaVaultBalances = result[1];
  usersAquaBnbVaultBalances = result[2];
  usersAquaCakeVaultBalances = result[3];
  usersAquaBusdVaultBalances = result[4];

  //AQUA-BNB
  erc20Multi.call('aquaBnbTotalSupply', aquaBnbLpTokenAddress, 'totalSupply');

  erc20Multi.call('lpAquaBal', aquaAddress, 'balanceOf', [
    aquaBnbLpTokenAddress
  ]);

  let erc20Result = await erc20Multi.execute();

  const totalSupply = erc20Result.aquaBnbTotalSupply.toString();

  const contractAquaBalance = erc20Result.lpAquaBal.toString();

  erc20Multi.call('lpTotalSupply', aquaCakeLpTokenAddress, 'totalSupply');

  erc20Multi.call('poolMMBalance', aquaAddress, 'balanceOf', [
    aquaCakeLpTokenAddress
  ]);

  erc20Result = await erc20Multi.execute();

  const totalSupplyAquaCake = erc20Result.lpTotalSupply.toString();

  const aquaCakeContractAquaBalance = erc20Result.poolMMBalance.toString();

  erc20Multi.call('lpTotalSupply', aquaBusdLpTokenAddress, 'totalSupply');
  //AQUA-BUSD
  erc20Multi.call('poolMMBalance', aquaAddress, 'balanceOf', [
    aquaBusdLpTokenAddress
  ]);

  erc20Result = await erc20Multi.execute();

  const totalSupplyAquaBusd = erc20Result.lpTotalSupply.toString();

  const aquaBusdContractAquaBalance = erc20Result.poolMMBalance.toString();

  return Object.fromEntries(
    Object.entries(score).map((address: any, index) => [
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
          parseFloat(formatUnits(aquaCakeContractAquaBalance, 18)) +
        (parseFloat(
          formatUnits(usersAquaBusdVaultBalances[index].toString(), 18)
        ) /
          parseFloat(formatUnits(totalSupplyAquaBusd, 18))) *
          parseFloat(formatUnits(aquaBusdContractAquaBalance, 18))
    ])
  );
}
