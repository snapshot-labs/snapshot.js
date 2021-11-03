import { getScores } from '../../utils';

export const author = 'kartojal';
export const version = '0.1.0';

/**
 * Aave Space Validation proposal validation uses:
 *  - Proposition power of GovernanceStrategy contract
 *  - Other active Aave Snapshot voting strategies
 *
 * The current validation implementation mutates the "strategies" field of the space
 * to be able to use proposition power instead of voting power for "aave-governance-power".
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

  const aaveGovernanceStrategyIndex = strategies.findIndex(
    ({ name }) => name === 'aave-governance-power'
  );

  // Use the proposition power instead of voting power
  if (aaveGovernanceStrategyIndex >= 0) {
    strategies[aaveGovernanceStrategyIndex].params.powerType = 'proposition';
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
