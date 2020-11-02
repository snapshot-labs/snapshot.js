const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');

const url = 'https://eth-mainnet.alchemyapi.io/v2/rXKbp7PTFm6hcrxU8NL-JGp5RMfRHDwg';
const provider = new JsonRpcProvider(networks[1].rpcUrl);

const strategies = [
  {
      "name": "erc20-balance-of",
      "params": {
        "address": "0x6e36556b3ee5aa28def2a8ec3dae30ec2b208739",
        "symbol": "BUILD",
        "decimals": 18
      }
  },
  {
      "name": "uniswap",
      "params": {
        "address": "0xDf6b861B4FBCFaffb62dD1906fCd3a863955704b",
        "tokenAddress": "0x6e36556b3ee5aa28def2a8ec3dae30ec2b208739",
        "symbol": "BUILD",
        "decimals": 18
      }
  },
  {
      "name": "unigraph",
      "params": {
        "address": "0xDf6b861B4FBCFaffb62dD1906fCd3a863955704b",
        "symbol": "BUILD",
        "decimals": 18
      }
  }
];

const addresses = [
  '0xcd07a45b8f8656594dae6d0b64de50ae73ffe375'
];

async function test() {
  const scores = await snapshot.utils.getScores(strategies, 1, provider, addresses);
  console.log('Scores', scores);
}

test();
