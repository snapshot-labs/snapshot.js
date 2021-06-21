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
  return snapshot.utils.getScoresDirect(
    'yam.eth',
    [example.strategy],
    example.network,
    new JsonRpcProvider(networks[example.network].rpc[0]),
    example.addresses,
    example.snapshot
  );
}

describe(`\nTest strategy "${strategy}"`, () => {
  let scores = null;
  let getScoresTime = null;

  it('Strategy should run without any errors', async () => {
    const getScoresStart = performance.now();
    scores = await callGetScores(example);
    const getScoresEnd = performance.now();
    // @ts-ignore
    getScoresTime = getScoresEnd - getScoresStart;
    console.log(scores);
    // @ts-ignore
    console.log(`Resolved in ${(getScoresTime / 1e3).toFixed(2)} sec.`);
  }, 2e4);

  it('Should return an array', () => {
    expect(scores).toBeTruthy();
    expect(Array.isArray(scores)).toBe(true);
  });

  it('Should take less than 10 sec. to resolve', () => {
    expect(getScoresTime).toBeLessThanOrEqual(10000);
  });

  it('File examples.json should include at least 1 address with a positive score', () => {
    // @ts-ignore
    expect(Object.keys(scores[0]).length).toBeGreaterThanOrEqual(1);
    // @ts-ignore
    expect(Object.values(scores[0]).some((val) => val > 0)).toBe(true);
  });

  it('File examples.json must use a snapshot block number in the past', async () => {
    expect(typeof example.snapshot).toBe('number');
    const provider = snapshot.utils.getProvider(example.network);
    const blockNumber = await snapshot.utils.getBlockNumber(provider);
    expect(example.snapshot).toBeLessThanOrEqual(blockNumber);
  });
});

(moreArg ? describe : describe.skip)(
  `\nTest strategy "${strategy}" (with ${moreArg || 500} voters)`,
  () => {
    let scoresMore = null;
    let getScoresTimeMore = null;

    it(`Should work with ${moreArg || 500} voters`, async () => {
      example.addresses = addresses.slice(0, moreArg);
      const getScoresStart = performance.now();
      scoresMore = await callGetScores(example);
      const getScoresEnd = performance.now();
      // @ts-ignore
      getScoresTimeMore = getScoresEnd - getScoresStart;
      // @ts-ignore
      console.log(`Resolved in ${(getScoresTimeMore / 1e3).toFixed(2)} sec.`);
      console.log(scoresMore);
      // wait for all logs to be printed (bug: printed after results)
      await new Promise((r) => setTimeout(r, 2000));
    }, 20000);

    it(`Should take less than 15 sec. to resolve with ${moreArg || 500} voters`, () => {
      expect(getScoresTimeMore).toBeLessThanOrEqual(15000);
    });
  }
);
