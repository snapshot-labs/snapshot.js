import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest, call } from '../../utils';
import { calculateEmission } from './utils';

export const author = 'maxaleks';
export const version = '0.1.0';

const EASY_STAKING_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/maxaleks/easy-staking';

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

async function getEasyStakingDeposits(addresses, snapshot) {
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
    const data = await subgraphRequest(EASY_STAKING_SUBGRAPH_URL, params);
    deposits = deposits.concat(data.deposits);
    page++;
    if (data.deposits.length < 1000) break;
  }
  return deposits.map((deposit: any) => ({
    ...deposit,
    amount: BigNumber.from(deposit.amount),
    timestamp: BigNumber.from(deposit.timestamp)
  }));
}

async function getEasyStakingParams(snapshot) {
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
    EASY_STAKING_SUBGRAPH_URL,
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
    block,
    totalSupply
  ] = await Promise.all([
    getEasyStakingDeposits(addresses, snapshot),
    getEasyStakingParams(snapshot),
    provider.getBlock(snapshot),
    call(provider, ercABI, [options.address, 'totalSupply', []])
  ]);
  const result = {};
  addresses.forEach((address) => {
    result[address] = 0;
  });
  if (!easyStakingDeposits || easyStakingDeposits.length === 0) {
    return result;
  }
  return Object.fromEntries(
    Object.entries(result).map(([address, balance]: any) => {
      let totalBalance = balance;
      const userDeposits = easyStakingDeposits.filter(
        (deposit) => deposit.user.toLowerCase() === address.toLowerCase()
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
