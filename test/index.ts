global['fetch'] = require('cross-fetch');
const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');
<<<<<<< HEAD

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
  },
  {
    "name": "contract-call",
    "params": {
      "address": "0x859a9d0d8bBF57C390A0BD8Fb4f5DE617e1De535",
      "decimals": 18,
      "symbol": "BUILD Staked",
      "methodABI": {
        "constant": true,
        "inputs": [{
          "internalType": "address",
          "name": "account",
          "type": "address"
        }],
        "name": "balanceOf",
        "outputs": [{
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
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
=======
const example = require('../src/strategies/staked-uniswap/examples.json')[0];

(async () => {
  try {
    console.log(example.name);
    console.time('getScores');
    const scores = await snapshot.utils.getScores(
      'build',
      [example.strategy],
      example.network,
      new JsonRpcProvider(networks[example.network].rpc[0]),
      example.addresses,
      example.snapshot
    );
    console.log(scores);
    console.timeEnd('getScores');
  } catch (e) {
    console.error(e);
  }
})();
>>>>>>> staked-uniswap
