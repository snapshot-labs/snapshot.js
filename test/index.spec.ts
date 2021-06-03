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

describe(`Test Snapshot strategy with addresses in examples.json:\n\nStrategy: "${strategy}"\nQuery: "${example.name}"\n\n`, () => {
  let scores = null;
  let getScoresTime = null;

  it('strategy should run without any errors', async () => {
    const getScoresStart = performance.now();
    scores = await callGetScores(example);
    const getScoresEnd = performance.now();
    getScoresTime = getScoresEnd - getScoresStart;
    console.log('Get Scores: ' + getScoresTime);
    console.log(scores);
  }, 20000);

  it('getScores function should return an array', () => {
    expect(scores).toBeTruthy();
    expect(Array.isArray(scores)).toBe(true);
  });

  it('strategy should take less than 10 seconds to resolve', () => {
    expect(getScoresTime).toBeLessThanOrEqual(10000);
  });

  it('examples.json should include at least 1 address with a positive score.', () => {
    expect(Object.keys(scores[0]).length).toBeGreaterThanOrEqual(1);
    expect(Object.values(scores[0]).some((val) => val > 0)).toBe(true);
  });

  it('examples.json must use a snapshot block number in the past.', async () => {
    expect(typeof example.snapshot).toBe('number');
    const provider = snapshot.utils.getProvider(example.network);
    const blockNumber = await snapshot.utils.getBlockNumber(provider);
    expect(example.snapshot).toBeLessThanOrEqual(blockNumber);
  });
});

(moreArg ? describe : describe.skip)(
  `\nTest Snapshot strategy with ${moreArg || 500} addresses:\n\nStrategy: "${strategy}"\nQuery: "${example.name}"\n(will be skipped if "--more=500" argument is not passed)\n\n`,
  () => {
    let scoresMore = null;
    let getScoresTimeMore = null;

    it(`strategy should work with ${moreArg || 500} addresses.`, async () => {
      example.addresses = addresses.slice(0, moreArg);
      const getScoresStart = performance.now();
      scoresMore = await callGetScores(example);
      const getScoresEnd = performance.now();
      getScoresTimeMore = getScoresEnd - getScoresStart;
      console.log(`Get Scores for ${moreArg} addresses:` + getScoresTimeMore);
      console.log(scoresMore);
      // wait for all logs to be printed (bug: printed after results)
      await new Promise((r) => setTimeout(r, 2000));
    }, 20000);

    it(`getScores function with ${moreArg || 500} addresses should return an array`, () => {
      expect(scoresMore).toBeTruthy();
      expect(Array.isArray(scoresMore)).toBe(true);
    });

    it(`strategy for ${moreArg || 500} addresses should take less than 15 seconds to resolve`, () => {
      expect(getScoresTimeMore).toBeLessThanOrEqual(15000);
    });
  }
);
