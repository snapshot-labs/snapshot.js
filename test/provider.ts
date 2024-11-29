const snapshot = require('../');

const provider_DEFAULT = snapshot.utils.getProvider('1');
console.log(provider_DEFAULT.connection.url == 'https://rpc.snapshot.org/1');

snapshot.utils.setBroviderUrl('https://rpc.custom.org');
const provider_CUSTOM = snapshot.utils.getProvider('56');
console.log(provider_CUSTOM.connection.url == 'https://rpc.custom.org/56');

