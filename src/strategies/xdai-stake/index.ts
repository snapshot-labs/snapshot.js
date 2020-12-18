import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'maxaleks';
export const version = '0.1.0';

const  EASY_STAKING_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/maxaleks/easy-staking',
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const params = {
    users: {
      __args: {
        where: {
          address_in: addresses.map((address) => address.toLowerCase()),
        },
        first: 1000,
      },
      address: true,
      totalDeposit: true,
    },
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.users.__args.block = { number: snapshot };
  }
  const [easyStakingData, erc20Score] = await Promise.all([
    subgraphRequest(EASY_STAKING_SUBGRAPH_URL[network], params),
    erc20BalanceOfStrategy(space, network, provider, addresses, options, snapshot),
  ]);
  if (!easyStakingData || !easyStakingData.users || easyStakingData.users.length === 0) {
    return erc20Score;
  }
  return Object.fromEntries(
    Object.entries(erc20Score).map(([address, balance]: any) => {
      let totalBalance = balance;
      const easyStakingUser = easyStakingData.users.find(user => user.address === address);
      if (easyStakingUser) {
        totalBalance += parseFloat(formatUnits(easyStakingUser.totalDeposit, options.decimals));
      }
      return [address, totalBalance];
    })
  );
}
