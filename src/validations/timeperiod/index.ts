export default async function validate(
  author: string,
  space,
  proposal,
  options
): Promise<boolean> {
  const onlyMembers = options.onlyMembers || space.filters?.onlyMembers;
  const members = (space.members || []).map((address) => address.toLowerCase());
  const { propEntryStart = 0, propEntryEnd = 0 } = options;

  if (!propEntryStart || !propEntryEnd || propEntryStart >= propEntryEnd)
    return false;

  if (members.includes(author.toLowerCase())) return true;

  if (onlyMembers) return false;

  const now = new Date().getTime();
  const startTime = new Date(propEntryStart).getTime();
  const endTime = new Date(propEntryEnd).getTime();

  // Only allow proposals being submitted in this time window.
  if (now >= startTime && now <= endTime) {
    return true;
  }

  return false;
}
