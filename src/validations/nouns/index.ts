import { getScores } from '../../utils';

export const author = 'waterdrops';
export const version = '0.1.0';

/**
 * Nouns Space Validation proposal validation uses:
 *
 * The current validation implementation mutates the "strategies" field of the space
 * to be able to use proposition power instead of voting power for "nouns-rfp-power".
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

  const nounsRFPStrategyIndex = strategies.findIndex(
    ({ name }) => name === 'nouns-rfp-power'
  );

  // Use the proposition power instead of the voting power
  if (nounsRFPStrategyIndex >= 0) {
    strategies[nounsRFPStrategyIndex].params.powerType = 'proposition';
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
