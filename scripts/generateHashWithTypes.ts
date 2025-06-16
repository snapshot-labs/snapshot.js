const { createHash } = require('crypto');

const types = {
  Statement: [
    { name: 'from', type: 'address' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'space', type: 'string' },
    { name: 'about', type: 'string' },
    { name: 'statement', type: 'string' }
  ]
};
function sha256(str) {
  return createHash('sha256').update(str).digest('hex');
}
const hash = sha256(JSON.stringify(types));
console.log(hash);
