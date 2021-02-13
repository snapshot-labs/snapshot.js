import { formatUnits, formatEther, parseUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const GRAPH_NETWORK_SUBGRAPH_URL = {
  '1':
    'https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-mainnet',
  '2':
    'https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-testnet'
};
export const WEI = '1000000000000000000';

export interface GraphAccountScores {
  [key: string]: BigNumber;
}

export interface NormalizedScores {
  [key: string]: Number;
}

// Returns a BigDecimal as a BigNumber with 10^18 extra zeros
// This allows a BN to be multiplied by a BD
// Then, the BN must be divided by 10^18 again to get the correct value
export function bdToBn(bd) {
  let bn;
  const splitDecimal = bd.split('.');

  if (splitDecimal.length > 1) {
    bn = `${splitDecimal[0]}.${splitDecimal[1].slice(0, 18)}`;
  }

  const bn2 = parseUnits(bn, 18);
  return bn2;
}
