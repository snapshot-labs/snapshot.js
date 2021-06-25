global['fetch'] = require('cross-fetch');
const snapshot = require('../');
const space = require('./examples/space.json');

(async () => {
  console.time('validation');
  try {
    const isValid = await snapshot.utils.validations.basic(
      '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7',
      space,
      {},
      {}
    );
    console.log('Is valid?', isValid);
  } catch (e) {
    console.log('validation failed');
    console.error(e);
  }
  console.timeEnd('validation');
})();
