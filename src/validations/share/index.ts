import { getScores } from '../../utils';

export const author = 'jinanton';
export const version = '0.1.0';

/**
 * Share Validation proposal validation uses:
 *  - Share of total supply of the token
 *
 * The current validation implementation mutates the "strategies" field of the space
 * to be able to use share of total supply instead of voting power for "voite power and share" strategy.
 *
 */

export default async function validate(
  author: string,
  space,
  proposal,
  options
): Promise<boolean> {
  const onlyMembers = options.onlyMembers || space.filters?.onlyMembers;
  const minScore = options.minScore || space.filters?.minScore;
  const members = (space.members || []).map((address) => address.toLowerCase());
  const strategies = [...space.strategies];

  const voitePowerAndShareStrategyIndex = strategies.findIndex(
    ({ name }) => name === 'voite-power-and-share'
  );

  // Use the share of total supply instead of voting power
  if (voitePowerAndShareStrategyIndex >= 0) {
    strategies[voitePowerAndShareStrategyIndex].params.powerType =
      'shareOfTotalSupply';
  }

  if (members.includes(author.toLowerCase())) return true;

  if (onlyMembers) return false;

  if (minScore) {
    const scores = await getScores(
      space.id || space.key,
      strategies,
      space.network,
      [author]
    );
    const totalScore: any = scores
      .map((score: any) => Object.values(score).reduce((a, b: any) => a + b, 0))
      .reduce((a, b: any) => a + b, 0);
    if (totalScore < minScore) return false;
  }

  return true;
}
