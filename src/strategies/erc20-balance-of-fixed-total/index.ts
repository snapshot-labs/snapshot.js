import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export async function strategy(network, provider, addresses, options, snapshot) {
  const score = await erc20BalanceOfStrategy(network, provider, addresses, options, snapshot);
  const totalScore = Object.values(score).reduce((a, b) => a + b, 0);
  return Object.fromEntries(
    Object.entries(score).map(address => [
      address[0],
      options.total * address[1] / totalScore
    ])
  );
}
