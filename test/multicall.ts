const snapshot = require('../');
const { abi } = require('./ERC20.json');
const { multicall, getProvider } = snapshot.utils;

const network = '11297108109';
const provider = getProvider(network);
const tokens = ['0x97d537169A3df0AA0838B565c8eAefC2b0Bf6EBd'];
const options = { blockTag: 1274228 };
const addresses = [
  '0x1479a759C6961cc18dADAebbd0a0D4695207b5B0',
  '0x0000000000000000000000000000000000000000'
];

async function run() {
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address) => [tokens[0], 'balanceOf', [address]]),
    options
  );

  console.log(response.map((r) => r.toString()));
}

run().catch(console.log);
