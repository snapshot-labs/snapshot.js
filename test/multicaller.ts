const snapshot = require('../');
const { abi } = require('./ERC20.json');
const { Multicaller, getProvider } = snapshot.utils;

const network = '1';
const provider = getProvider(network);
const tokens = [
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
];
const options = { blockTag: 10000000 };

const multi = new Multicaller(network, provider, abi, options);
tokens.forEach(token => {
  multi.call(`${token}.name`, token, 'name');
  multi.call(`${token}.symbol`, token, 'symbol');
  multi.call(`${token}.decimals`, token, 'decimals');
});

multi.execute().then(result => {
  console.log('Multicaller result', result);
  /* Multicaller result
  {
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18
    },
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18
    },
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': {
      name: 'Wrapped BTC',
      symbol: 'WBTC',
      decimals: 8
    }
  }
  */
});
