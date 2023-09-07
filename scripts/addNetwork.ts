const networks = require('../src/networks.json');
const { getAddress } = require('@ethersproject/address');

if (process.argv.length < 7) {
  console.log(
    'Usage: ts-node scripts/addNetwork.ts <chainId> <explorer> <multicall> <start> <logo> <networkName> <shortName> <testnet (optional)>'
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const chainId = args[0];
const explorer = args[1];
const multicall = getAddress(args[2]);
const start = args[3];
const logo = args[4];
const networkName = args[5];
const shortName = args[6];
const testnet = args[7] === 'true' || args[7] === 'yes' ? true : false;

const network = {
  key: chainId,
  name: networkName,
  shortName,
  chainId: parseInt(chainId, 10),
  network: testnet ? 'testnet' : 'mainnet',
  multicall,
  rpc: [],
  explorer: {
    url: explorer
  },
  start: parseInt(start, 10),
  logo: `ipfs://${logo}`
};
// @ts-ignore
if (testnet) network.testnet = true;

networks[chainId] = network;
console.log(networks[chainId]);

require('fs').writeFileSync(
  'src/networks.json',
  JSON.stringify(networks, null, 2),
  'utf8'
);
