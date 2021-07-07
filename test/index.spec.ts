const { JsonRpcProvider } = require('@ethersproject/providers');
const snapshot = require('../');
const networks = require('../src/networks.json');
const addresses = require('./addresses.json');

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
    getScoresTime = getScoresEnd - getScoresStart;
    console.log(scores);
    console.log(`Resolved in ${(getScoresTime / 1e3).toFixed(2)} sec.`);
  }, 2e4);

  it('Should return an array of object with addresses', () => {
    expect(scores).toBeTruthy();
    // Check array
    expect(Array.isArray(scores)).toBe(true);
    // Check array contains a object
    expect(typeof scores[0]).toBe('object');
    // Check object contains at least one address from example.json
    expect(Object.keys(scores[0]).length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(scores[0])
      .some(address => example.addresses.map(v => v.toLowerCase())
      .includes(address.toLowerCase()))).toBe(true);
    // Check if all scores are numbers
    expect(Object.values(scores[0]).every((val, i, arr) => typeof val === 'number')).toBe(true)
  });

  it('Should take less than 10 sec. to resolve', () => {
    expect(getScoresTime).toBeLessThanOrEqual(10000);
  });

  it('File examples.json should include at least 1 address with a positive score', () => {
    expect(Object.values(scores[0]).some((score) => score > 0)).toBe(true);
  });

  it('File examples.json must use a snapshot block number in the past', async () => {
    expect(typeof example.snapshot).toBe('number');
    const provider = snapshot.utils.getProvider(example.network);
    const blockNumber = await snapshot.utils.getBlockNumber(provider);
    expect(example.snapshot).toBeLessThanOrEqual(blockNumber);
  });
});

describe(`\nTest strategy "${strategy}" with latest snapshot`, () => {
  let scores = null;
  let getScoresTime = null;

  it('Strategy should run without any errors', async () => {
    const getScoresStart = performance.now();
    scores = await callGetScores({...example, snapshot: 'latest'});
    const getScoresEnd = performance.now();
    getScoresTime = getScoresEnd - getScoresStart;
    console.log('Scores with latest snapshot', scores);
    console.log(`Resolved in ${(getScoresTime / 1e3).toFixed(2)} sec.`);
    // wait for all logs to be printed (bug: printed after results)
    await new Promise((r) => setTimeout(r, 100));
  }, 2e4);

  it('Should return an array of object with addresses', () => {
    expect(scores).toBeTruthy();
    // Check array
    expect(Array.isArray(scores)).toBe(true);
    // Check array contains a object
    expect(typeof scores[0]).toBe('object');
    // Check object contains atleast one address from example.json
    expect(Object.keys(scores[0]).length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(scores[0])
      .some(address => example.addresses.map(v => v.toLowerCase())
      .includes(address.toLowerCase()))).toBe(true);

    // Check if all scores are numbers
    expect(Object.values(scores[0]).every((val, i, arr) => typeof val === 'number')).toBe(true)
  });
});

(moreArg ? describe : describe.skip)(
  `\nTest strategy "${strategy}" (with ${moreArg || 500} addresses)`,
  () => {
    let scoresMore = null;
    let getScoresTimeMore = null;

    it(`Should work with ${moreArg || 500} addresses`, async () => {
      example.addresses = addresses.slice(0, moreArg);
      const getScoresStart = performance.now();
      scoresMore = await callGetScores(example);
      const getScoresEnd = performance.now();
      getScoresTimeMore = getScoresEnd - getScoresStart;
      console.log(`Scores with ${moreArg || 500} addresses`, scoresMore);
      console.log(`Resolved in ${(getScoresTimeMore / 1e3).toFixed(2)} sec.`);
      // wait for all logs to be printed (bug: printed after results)
      await new Promise((r) => setTimeout(r, 100));
    }, 20000);

    it(`Should take less than 15 sec. to resolve with ${moreArg || 500} addresses`, () => {
      expect(getScoresTimeMore).toBeLessThanOrEqual(20000);
    });
  }
);
