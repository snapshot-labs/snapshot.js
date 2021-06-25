import { getScores } from '../../utils';

export default async function validate(
  author: string,
  space,
  proposal,
  options
): Promise<boolean> {
  const strategies = options.strategies || space.strategies;
  const onlyMembers = options.onlyMembers || space.filters?.onlyMembers;
  const minScore = options.minScore || space.filters?.minScore;
  const members = (space.members || []).map((address) => address.toLowerCase());

  if (members.includes(author.toLowerCase())) return true;

  if (onlyMembers) return false;

  if (minScore) {
    const scores = await getScores(
      space.id || space.key,
      strategies,
      space.network,
      '',
      [author]
    );
    const totalScore: any = scores
      .map((score: any) => Object.values(score).reduce((a, b: any) => a + b, 0))
      .reduce((a, b: any) => a + b, 0);
    if (totalScore < minScore) return false;
  }

  return true;
}
