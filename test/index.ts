const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');

const network = 1;
const url = 'https://eth-mainnet.alchemyapi.io/v2/rXKbp7PTFm6hcrxU8NL-JGp5RMfRHDwg';
const provider = new JsonRpcProvider(url);

const strategies = [
  ['erc20-balance-of', {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    decimals: 18
  }],
  ['yearn-vault', {
    address: '0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1',
    decimals: 18
  }],
  ['eth-balance'],
];

const addresses = [
  '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
  '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
  '0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1'
];

async function test() {
  const scores = await snapshot.utils.getScores(strategies, network, provider, addresses);
  console.log('Scores', scores);
}

test();
