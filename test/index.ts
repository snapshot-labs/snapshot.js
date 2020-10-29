const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');

const network = 42;
// const url = 'https://eth-mainnet.alchemyapi.io/v2/fimsdrLNuwLMmDgFvuH_XRLgwE1hpHiR';
const url = 'https://eth-kovan.alchemyapi.io/v2/QCsM2iU0bQ49eGDmZ7-Y--Wpu0lVWXSO' // Kovan
const provider = new JsonRpcProvider(url);

const strategies = [
  {
    name: 'erc20-balance-of-with-delegation',
    params: {
      address: '0x1528f3fcc26d13f7079325fb78d9442607781c8c',
      decimals: 18
    }
  }
];

const addresses = [
  '0x0000000000000000000000000000000000baddad',
  '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
  '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
  '0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1',
  '0x4C7909d6F029b3a5798143C843F4f8e5341a3473'
];

async function test() {
  const scores = await snapshot.utils.getScores(strategies, network, provider, addresses);
  console.log('Scores', scores);
}

test();
