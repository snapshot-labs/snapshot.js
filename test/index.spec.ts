global['fetch'] = require('cross-fetch');
const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');
const addresses = require('./addresses.json');

/*
## Usage
`npm run test` // Tests default (erc20-balance-of)
`npm run test --strategy=erc20-received`
`npm run test --strategy=eth-balance`
`npm run test --strategy=eth-balance --more=200 // to test with more addresses from addresses.json`
*/

const strategyArg =
  process.env['npm_config_strategy'] ||
  (
    process.argv.find((arg) => arg.includes('--strategy=')) ||
    '--strategy=erc20-balance-of'
  )
    .split('--strategy=')
    .pop();

const moreArg =
  process.env['npm_config_more'] ||
  process.argv
    .find((arg) => arg.includes('--more='))
    ?.split('--more=')
    ?.pop();

const strategy = Object.keys(snapshot.strategies).find((s) => strategyArg == s);
if (!strategy) throw 'Strategy not found';
const example = require(`../src/strategies/${strategy}/examples.json`)[0];

function callGetScores(example) {
  return snapshot.utils.getScores(
    'yam.eth',
    [example.strategy],
    example.network,
    new JsonRpcProvider(networks[example.network].rpc[0]),
    example.addresses,
    example.snapshot
  );
}

describe(`Snapshot Strategy Test:\n\nStrategy: "${strategy}"\nQuery: "${example.name}"\n\n`, () => {
  let scores = null;
  let getScoresTime = null;

  it('Should run startegy without any errors', async () => {
    const getScoresStart = performance.now();
    scores = await callGetScores(example);
    const getScoresEnd = performance.now();
    getScoresTime = getScoresEnd - getScoresStart;
    console.log('Get Scores: ' + getScoresTime);
    console.log(scores);
  }, 20000);

  it('getScores should return an array', () => {
    expect(scores).toBeTruthy();
    expect(Array.isArray(scores)).toBe(true);
  });

  it('The strategy should take less than 10 seconds to resolve', () => {
    expect(getScoresTime).toBeLessThanOrEqual(10000);
  });

  it('Example must include at least 1 address with a positive score.', () => {
    expect(Object.keys(scores[0]).length).toBeGreaterThanOrEqual(1);
    expect(Object.values(scores[0]).some((val) => val > 0)).toBe(true);
  });

  it('Example must use a snapshot block number in the past.', async () => {
    expect(typeof example.snapshot).toBe('number');
    const provider = snapshot.utils.getProvider(example.network);
    const blockNumber = await snapshot.utils.getBlockNumber(provider);
    expect(example.snapshot).toBeLessThanOrEqual(blockNumber);
  });

  (moreArg ? it : it.skip)(
    'The strategy should work with 500 addresses.\n      (will be skipped if "--more=500" argument is not passed)',
    async () => {
      example.addresses = addresses.slice(0, moreArg);
      const getScoresStart = performance.now();
      scores = await callGetScores(example);
      const getScoresEnd = performance.now();
      getScoresTime = getScoresEnd - getScoresStart;
      console.log('Get Scores for 500 addresses:' + getScoresTime);
      console.log(scores);
      // wait for all logs to be printed (bug: printed after results)
      await new Promise((r) => setTimeout(r, 2000));
    },
    20000
  );

  (moreArg ? it : it.skip)(
    'getScores 500 should return an array\n      (will be skipped if "--more=500" argument is not passed)',
    () => {
      expect(scores).toBeTruthy();
      expect(Array.isArray(scores)).toBe(true);
    }
  );

  (moreArg ? it : it.skip)(
    'The strategy for 500 addresses should take less than 10 seconds to resolve\n      (will be skipped if "--more=500" argument is not passed)',
    () => {
      expect(getScoresTime).toBeLessThanOrEqual(10000);
    }
  );
});
