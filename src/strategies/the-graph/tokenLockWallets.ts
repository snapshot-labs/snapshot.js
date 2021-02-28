import { subgraphRequest } from '../../utils';
import { verifyResults } from './graphUtils';

export const TOKEN_DISTRIBUTION_SUBGRAPH_URL = {
  '1':
    'https://api.thegraph.com/subgraphs/name/graphprotocol/token-distribution',
  '4':
    'https://api.thegraph.com/subgraphs/name/davekaj/token-distribution-rinkeby'
};
interface TokenLockWallets {
  [key: string]: string[];
}

/*
  @dev Queries the subgraph to find if an address owns any token lock wallets
  @returns An object with the beneficiaries as keys and TLWs as values in an array 
*/
export async function getTokenLockWallets(
  _space,
  network,
  _provider,
  addresses,
  options,
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
    tokenLockParams.tokenLockWallets.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    TOKEN_DISTRIBUTION_SUBGRAPH_URL[network],
    tokenLockParams
  );

  const tokenLockWallets: TokenLockWallets = {};
  if (result && result.tokenLockWallets) {
    if (options.expectedResults) {
      verifyResults(
        JSON.stringify(result.tokenLockWallets),
        JSON.stringify(options.expectedResults.tokenLockWallets),
        'Token lock wallets'
      );
    }
    result.tokenLockWallets.forEach((tw) => {
      if (tokenLockWallets[tw.beneficiary] == undefined)
        tokenLockWallets[tw.beneficiary] = [];
      tokenLockWallets[tw.beneficiary] = tokenLockWallets[
        tw.beneficiary
      ].concat(tw.id);
    });
  } else {
    console.error('Subgraph request failed');
  }
  return tokenLockWallets || {};
}
