const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');

const url = 'https://eth-mainnet.alchemyapi.io/v2/rXKbp7PTFm6hcrxU8NL-JGp5RMfRHDwg';
const provider = new JsonRpcProvider(url);

const strategies = [
  ['erc20-balance-of', {
    "address": '0x6e36556b3ee5aa28def2a8ec3dae30ec2b208739',
    "decimals": 18
  }],
  ['uniswap', {
    "address": "0xDf6b861B4FBCFaffb62dD1906fCd3a863955704b",
    "tokenAddress": "0x6e36556b3ee5aa28def2a8ec3dae30ec2b208739",
    "symbol": "BUILD",
    "decimals": 18
  }]
];

const addresses = [
  '0x01ba5319fb2dc2d379b96068f25afff27fd18c46'
];

async function test() {
  const scores = await snapshot.utils.getScores(strategies, 1, provider, addresses);
  console.log('Scores', scores);
}

test();
