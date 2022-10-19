const snapshot = require('../');

const validation = 'basic';
const author = '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7';
const space = 'fabien.eth';
const network = '1';
const params = {
  minScore: 0.9,
  strategies: [
    {
      name: 'eth-balance',
      params: {}
    }
  ]
};

snapshot.utils
  .validate(validation, author, space, network, 'latest', params)
  .then((result) => console.log(result))
  .catch((e) => console.log(e));
