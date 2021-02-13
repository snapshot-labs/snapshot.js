import { subgraphRequest } from '../../utils';

export const TOKEN_DISTRIBUTION_SUBGRAPH_URL = {
  '1':
    'https://api.thegraph.com/subgraphs/name/graphprotocol/token-distribution',
  '2':
    'https://api.thegraph.com/subgraphs/name/davekaj/token-distribution-rinkeby'
};
interface TokenLockWallets {
  [key: string]: string[];
}

export async function getTokenLockWallets(
  _space,
  network,
  _provider,
  addresses,
  _options,
  snapshot
): Promise<TokenLockWallets> {
  const tokenLockParams = {
    tokenLockWallets: {
      __args: {
        where: {
          beneficiary_in: addresses
        },
        first: 1000
      },
      id: true,
      beneficiary: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.graphAccounts.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    TOKEN_DISTRIBUTION_SUBGRAPH_URL[network],
    tokenLockParams
  );
  const tokenLockWallets: TokenLockWallets = {};
  if (result && result.tokenLockWallets) {
    result.tokenLockWallets.forEach((tw) => {
      if (tokenLockWallets[tw.beneficiary] == undefined)
        tokenLockWallets[tw.beneficiary] = [];
      tokenLockWallets[tw.beneficiary] = tokenLockWallets[
        tw.beneficiary
      ].concat(tw.id);
    });
  }
  return tokenLockWallets || {};
}
