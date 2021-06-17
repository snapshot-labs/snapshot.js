import fetch from 'cross-fetch';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

export const author = 'maxaleks';
export const version = '0.1.0';

const SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/maxaleks/xdai-stakers';

async function getUsers(addresses, snapshot, userType) {
  const params = {
    [userType]: {
      __args: {
        where: {
          address_in: addresses.map((address) => address.toLowerCase()),
          balance_gt: 0
        },
        first: 1000,
        skip: 0
      },
      address: true,
      balance: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params[userType].__args.block = { number: snapshot };
  }
  let page = 0;
  let users = [];
  while (true) {
    params[userType].__args.skip = page * 1000;
    const data = await subgraphRequest(SUBGRAPH_URL, params);
    users = users.concat(data[userType]);
    page++;
    if (data[userType].length < 1000) break;
  }
  return users;
}

const getXdaiBlockNumber = async (timestamp: number): Promise<number> =>
  fetch(
    `https://blockscout.com/xdai/mainnet/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before`
  )
    .then((r) => r.json())
    .then((r) => Number(r.result.blockNumber));

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  let xdaiSnapshot: any = 'latest';
  if (snapshot !== 'latest') {
    const { timestamp } = await provider.getBlock(snapshot);
    xdaiSnapshot = await getXdaiBlockNumber(timestamp);
  }
  const users = await getUsers(addresses, xdaiSnapshot, options.userType);
  const result = {};
  addresses.forEach((address) => {
    result[address] = 0;
  });
  if (!users || users.length === 0) {
    return result;
  }
  return Object.fromEntries(
    Object.entries(result).map(([address]: any) => {
      const user: any = users.find(
        (item: any) => item.address.toLowerCase() === address.toLowerCase()
      );
      let balance = 0;
      if (user) {
        balance = parseFloat(formatUnits(user.balance, options.decimals));
      }
      return [address, balance];
    })
  );
}
