export const author = 'adventureland';
export const version = '0.0.1';

interface ApiReturn {
  staked: number;
}

const apiUrl = 'https://api.adventureland.finance';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const promisesBalances = addresses.map((address) =>
    fetch(
      `${apiUrl}/api/governance/vote/${address}/${blockTag}`
    ).then((response) => response.json())
  );
  const balances: ApiReturn[] = await Promise.all(promisesBalances);

  const balancesMapping = addresses.reduce(
    (acc, address, index) => ({ ...acc, [address]: balances[index].staked }),
    {}
  );

  return balancesMapping;
}