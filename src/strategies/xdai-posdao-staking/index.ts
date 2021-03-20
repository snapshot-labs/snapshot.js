import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

export const author = 'maxaleks';
export const version = '0.1.0';

const POSDAO_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/maxaleks/xdai-stakers';

async function getStakers(addresses, snapshot) {
  const params = {
    stakers: {
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
    params.stakers.__args.block = { number: snapshot };
  }
  let page = 0;
  let stakers = [];
  while (true) {
    params.stakers.__args.skip = page * 1000;
    const data = await subgraphRequest(POSDAO_SUBGRAPH_URL, params);
    stakers = stakers.concat(data.stakers);
    page++;
    if (data.stakers.length < 1000) break;
  }
  return stakers;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const stakers = await getStakers(addresses, snapshot);
  const result = {};
  addresses.forEach((address) => {
    result[address] = 0;
  });
  if (!stakers || stakers.length === 0) {
    return result;
  }
  return Object.fromEntries(
    Object.entries(result).map(([address]: any) => {
      const staker = stakers.find(
        (item) => item.address.toLowerCase() === address.toLowerCase()
      );
      let balance = 0;
      if (staker) {
        balance = parseFloat(formatUnits(staker.balance, options.decimals));
      }
      return [address, balance];
    })
  );
}
