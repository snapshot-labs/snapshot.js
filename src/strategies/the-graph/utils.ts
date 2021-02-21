import { formatUnits, formatEther, parseUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const GRAPH_NETWORK_SUBGRAPH_URL = {
  '1':
    'https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-mainnet',
  '4':
    'https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-testnet'
};
export const WEI = '1000000000000000000';

export interface GraphAccountScores {
  [key: string]: number;
}

// Pass in a BigDecimal and BigNumber from a subgraph query, and return the multiplication of
// them as a BigNumber
export function bdMulBn(bd: string, bn: string): BigNumber {
  const splitDecimal = bd.split('.');
  let split;
  // Truncate the BD so it can be converted to a BN (no decimals) when multiplied by WEI
  if (splitDecimal.length > 1) {
    split = `${splitDecimal[0]}.${splitDecimal[1].slice(0, 18)}`;
  }
  // Convert it to BN
  const bdWithWEI = parseUnits(split, 18);
  // Multiple, then divide by WEI to have it back in BN
  return BigNumber.from(bn).mul(bdWithWEI).div(BigNumber.from(WEI));
}

export function calcNonStakedTokens(
  totalSupply: string,
  totalTokensStaked: string,
  totalDelegatedTokens: string
): number {
  return BigNumber.from(totalSupply)
    .sub(BigNumber.from(totalTokensStaked))
    .sub(BigNumber.from(totalDelegatedTokens))
    .div(BigNumber.from(WEI))
    .toNumber();
}
