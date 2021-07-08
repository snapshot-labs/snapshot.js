const snapshot = require('../');
const defaultSpace = require('./examples/space.json');

/*
## Usage
`npm run test:validation` // Tests default (basic)
`npm run test:validation --validation=aave`
*/

const validationArg =
  process.env['npm_config_validation'] ||
  (
    process.argv.find((arg) => arg.includes('--validation=')) ||
    '--validation=basic'
  )
    .split('--validation=')
    .pop();

const validation = Object.keys(snapshot.utils.validations).find(
  (s) => validationArg == s
);
if (!validation) throw 'Validation function not found';
const example = require(`../src/validations/${validation}/examples.json`)[0];

describe(`\nTest validation "${validation}"`, () => {
  let isValid = false;
  let getValidationTime = null;

  it('Validation should run without any errors', async () => {
    try {
      const performanceStart = performance.now();
      isValid = await snapshot.utils.validations[validation](
        example.userAddress,
        example.space || defaultSpace,
        {},
        example.validation.params || {}
      );
      const performanceEnd = performance.now();
      getValidationTime = performanceEnd - performanceStart;
      console.log('Proposal Validation output:', isValid);
      console.log(`Resolved in ${(getValidationTime / 1e3).toFixed(2)} sec.`);
    } catch (error) {
      console.log('Validation failed');
      console.error(error);
    }
  }, 2e4);

  it('Should return truthy output', () => {
    expect(isValid).toBeTruthy();
  });

  it('Should take less than 10 sec. to resolve', () => {
    expect(getValidationTime).toBeLessThanOrEqual(10_000);
  });
});
