const { createHash } = require('crypto');

const types = {
  DeleteSubscription: [
    { name: 'from', type: 'address' },
    { name: 'type', type: 'string' },
    { name: 'value', type: 'string' },
    { name: 'timestamp', type: 'uint64' }
  ]
};
function sha256(str) {
  return createHash('sha256').update(str).digest('hex');
}
const hash = sha256(JSON.stringify(types));
console.log(hash);
