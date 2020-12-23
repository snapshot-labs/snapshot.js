import fetch from 'cross-fetch';

export const author = 'chaituvr';
export const version = '0.1.0';

const delay = interval => new Promise(resolve => setTimeout(resolve, interval));

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
  ) {
  const apiLimit = 300;
  let data = []

  data = await Promise.all(addresses.map((address, index) => {
    return new Promise(resolve => setTimeout(resolve, apiLimit * index))
      .then(
        () => fetch(
          `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&offset=1&page=1&sort=asc&apikey=${options.etherscanApiKey}`
        )
      ).then(
        a => a.json()
      )
    }
  ))
  return Object.fromEntries(
    data.map((value, i) => [
      addresses[i],
      (() => {
        if(value.status === '1') {
          const firstTransaction = value.result[0].timeStamp * 1000;
          const today = new Date().getTime();
          const diffInSeconds = Math.abs(firstTransaction - today);
          const walletAgeInDays = Math.floor(diffInSeconds / 1000 / 60 / 60 / 24);
          return walletAgeInDays
        }
        return 0
      })()
    ])
  );
}
