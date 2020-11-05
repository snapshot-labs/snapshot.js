// const { JsonRpcProvider } = require('@ethersproject/providers');
// const snapshot = require('../');
// const networks = require('../src/networks.json');
// const example = require('../src/strategies/erc20-balance-of-delegation/examples.json')[0];

// (async () => {
//   try {
//     const scores = await snapshot.utils.getScores(
//       [example.strategy],
//       example.network,
//       new JsonRpcProvider(networks[example.network].rpcUrl),
//       example.addresses,
//       example.snapshot
//     );
//     console.log(example.name, scores);
//   } catch (e) {
//     console.error(e);
//   }
// })();

const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');

const network = 1;
const url = 'https://mainnet.infura.io/v3/1f6548267265429ca5afaeccc1b6e45e';
const provider = new JsonRpcProvider(url);

const strategies = [
  {
    name: 'erc20-balance-of',
    params: {
      omStakingAddress: '0x2bCD929283Ad0EE603E743412ddb214b91fbab88',
      omUniStakingAddress: '0x99b1db3318aa3040f336fb65c55400e164ddcd7f',
      omUniScalingFactor: '2',
      decimals: 18
    }
  }
];

const addresses = [
  '0x12e79894e7d9EdC6f1Ea7dB7bB9AC8F911BE716b',
  '0xaDa8eD7B758d451be73D9F2c8F3716eEf207AE79',
  '0x4cd056505C0280Aee7E1428180FB1E490e429763'
];

async function test() {
  const scores = await snapshot.utils.getScores(strategies, network, provider, addresses);
  console.log('Scores', scores);
}

test();

