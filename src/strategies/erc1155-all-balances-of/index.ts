import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'fragosti';
export const version = '0.1.0';

export const SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/alexvorobiov/eip1155subgraph'
};

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const eip1155OwnersParams = {
    accounts: {
      __args: {
        where: {
          id_in: addresses.map((a) => a.toLowerCase())
        }
      },
      id: true,
      balances: {
        value: true,
        token: {
          registry: {
            id: true
          }
        }
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    eip1155OwnersParams.accounts.__args.block = { number: snapshot };
  }
  try {
    const result = await subgraphRequest(
      SUBGRAPH_URL[network],
      eip1155OwnersParams
    );
    return result.accounts.reduce((acc, val) => {
      const relevantTokenBalances = val.balances.filter((balance) => {
        const isRightAddress =
          balance.token.registry.id === options.address.toLowerCase();
        return isRightAddress;
      });
      acc[getAddress(val.id)] = relevantTokenBalances.reduce(
        (acc, val) => acc + parseInt(val.value, 10),
        0
      );
      return acc;
    }, {} as Record<string, number>);
  } catch (err) {
    return {};
  }
}
