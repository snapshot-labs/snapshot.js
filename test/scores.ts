const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');

const space = 'aragon';
const network = '1';
const strategies = [
  {
    name: 'erc20-balance-of',
    params: {
      address: '0xa117000000f279D81A1D3cc75430fAA017FA5A2e',
      symbol: 'ANT',
      decimals: 18
    }
  },
  {
    name: 'balancer',
    params: {
      address: '0xa117000000f279D81A1D3cc75430fAA017FA5A2e',
      symbol: 'ANT BPT'
    }
  }
];
const addresses = [
  '0x37Bf78fA8853CEE7df39280e70e38f3e163E44c4',
  '0xdD36C6C74abd4feF4EbCFB42D4622435D5f2c5f0',
  '0x98A729d4F94111ac21Df906fCdA107DcbC65d0B7',
  '0x1a3e98369a9e935d5E807514Fd479Ebf075863c6',
  '0x8fC0620C1f2cf352727E56dF8a895c6779095EF0',
  '0x148a1E9373Ad8D83a8b12592ec90b6F5151b176f',
  '0x4C632beE45E771Beb190B821bb7aa9f2c3D152ba',
  '0xf9c82b33C87Cfbbd1Ba7fa521dBC02dA31680F1a',
  '0x96646a92D0801b30C227404053A35c21A5290fec',
  '0xe3534F90E367F5bd62AF306d9F36804a82ba6cAc',
  '0x580a986b101A9Bed1283BfC7040F1153112b6c42'
];

(async () => {
  console.time('getScores');
  try {
    const scores = await snapshot.utils.getScoresDirect(
      space,
      strategies,
      network,
      new JsonRpcProvider(networks[network].rpc[0]),
      addresses,
      11282870
    );
    console.log(scores);
  } catch (e) {
    console.log('getScores failed');
    console.error(e);
  }
  console.timeEnd('getScores');
})();
