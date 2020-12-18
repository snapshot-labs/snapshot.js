import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest, call } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { calculateEmission } from './utils';

export const author = 'maxaleks';
export const version = '0.1.0';

const EASY_STAKING_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/maxaleks/easy-staking'
};

const ercABI = [
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

async function getEasyStakingDeposits(network, addresses, snapshot) {
  const params = {
    deposits: {
      __args: {
        where: {
          user_in: addresses.map((address) => address.toLowerCase()),
          amount_gt: 0
        },
        first: 1000,
        skip: 0
      },
      user: true,
      amount: true,
      timestamp: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.deposits.__args.block = { number: snapshot };
  }
  let page = 0;
  let deposits = [];
  while (true) {
    params.deposits.__args.skip = page * 1000;
    const data = await subgraphRequest(
      EASY_STAKING_SUBGRAPH_URL[network],
      params
    );
    deposits = deposits.concat(data.deposits);
    page++;
    if (data.deposits.length < 1000) break;
  }
  return deposits.map((deposit) => ({
    ...deposit,
    amount: BigNumber.from(deposit.amount),
    timestamp: BigNumber.from(deposit.timestamp)
  }));
}

async function getEasyStakingParams(network, snapshot) {
  const params = {
    commonData: {
      __args: {
        id: 'common'
      },
      sigmoidParamA: true,
      sigmoidParamB: true,
      sigmoidParamC: true,
      totalSupplyFactor: true,
      totalStaked: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.commonData.__args.block = { number: snapshot };
  }
  const { commonData } = await subgraphRequest(
    EASY_STAKING_SUBGRAPH_URL[network],
    params
  );
  return {
    sigmoidParameters: {
      a: BigNumber.from(commonData.sigmoidParamA),
      b: BigNumber.from(commonData.sigmoidParamB),
      c: BigNumber.from(commonData.sigmoidParamC)
    },
    totalSupplyFactor: BigNumber.from(commonData.totalSupplyFactor),
    totalStaked: BigNumber.from(commonData.totalStaked)
  };
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const [
    easyStakingDeposits,
    { sigmoidParameters, totalSupplyFactor, totalStaked },
    erc20Score,
    block,
    totalSupply
  ] = await Promise.all([
    getEasyStakingDeposits(network, addresses, snapshot),
    getEasyStakingParams(network, snapshot),
    erc20BalanceOfStrategy(
      space,
      network,
      provider,
      addresses,
      options,
      snapshot
    ),
    provider.getBlock(snapshot),
    call(provider, ercABI, [options.address, 'totalSupply', []])
  ]);
  if (!easyStakingDeposits || easyStakingDeposits.length === 0) {
    return erc20Score;
  }
  return Object.fromEntries(
    Object.entries(erc20Score).map(([address, balance]: any) => {
      let totalBalance = balance;
      const userDeposits = easyStakingDeposits.filter(
        (deposit) => deposit.user === address
      );
      userDeposits.forEach((deposit) => {
        const timePassed = BigNumber.from(block.timestamp).sub(
          deposit.timestamp
        );
        const emission = calculateEmission(
          deposit.amount,
          timePassed,
          sigmoidParameters,
          totalSupplyFactor,
          totalSupply,
          totalStaked
        );
        totalBalance += parseFloat(
          formatUnits(deposit.amount.add(emission).toString(), options.decimals)
        );
      });
      return [address, totalBalance];
    })
  );
}
