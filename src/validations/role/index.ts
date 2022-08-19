export default async function validate(
  author: string,
  space,
  proposal,
  options
): Promise<boolean> {
  const onlyMembers = options.onlyMembers || space.filters?.onlyMembers;
  const members = (space.members || []).map((address) => address.toLowerCase());
  const strategies = [...space.strategies];
  const getRoleIndex = strategies.findIndex(
    ({ name }) => name === 'contract-call'
  );
  if (members.includes(author.toLowerCase())) return true;
  if (onlyMembers) return false;
  if (getRoleIndex <= 2) {
    return false;
  }
  return true;
}
