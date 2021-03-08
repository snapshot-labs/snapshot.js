import fetch from 'cross-fetch';

export const author = 'Jordan Travaux';
export const version = '0.1.0';

const getAddressTotalAxion = async (address: string) => {
  const rawResponse = await fetch(`https://gateway.axntoday.com/v1/staker/${address}`);
  const content = await rawResponse.json();
  return (content.stats.balance + content.stats.totalStaked);
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  return Object.fromEntries(
    await Promise.all(addresses.map(
      async (address: string) => [
        address, 
        await getAddressTotalAxion(address)
      ]
    ))
  );
}
