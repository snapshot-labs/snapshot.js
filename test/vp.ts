const snapshot = require('../');

const address = '0xeF8305E140ac520225DAf050e2f71d5fBcC543e7';
const network = '1';
const strategies = [
  {
    name: 'eth-balance',
    params: {}
  }
];
const s = 'latest';
const space = 'fabien.eth';
const delegation = false;

snapshot.utils
  .getVp(address, network, strategies, s, space, delegation)
  .then((result) => console.log(result));
