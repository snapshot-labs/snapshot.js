import { getScores } from '../../utils';
import getProvider from '../../utils/provider';

export default async function validate(
  author: string,
  space,
  proposal,
  options
): Promise<boolean> {
  const members = (space.members || []).map((address) => address.toLowerCase());
  const isMember = members.includes(author.toLowerCase());

  if (isMember) return true;

  if (space.filters?.onlyMembers) return false;

  if (space.filters?.minScore) {
    const scores = await getScores(
      space.id || space.key,
      space.strategies,
      space.network,
      getProvider(space.network),
      [author]
    );
    const totalScore: any = scores
      .map((score: any) => Object.values(score).reduce((a, b: any) => a + b, 0))
      .reduce((a, b: any) => a + b, 0);
    if (totalScore < space.filters.minScore) return false;
  }

  return true;
}
