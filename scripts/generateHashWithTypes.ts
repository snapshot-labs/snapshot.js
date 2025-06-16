const { createHash } = require('crypto');

const types = {
  Vote: [
    { name: 'from', type: 'string' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'bytes32' },
    { name: 'choice', type: 'uint32[]' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};
function sha256(str) {
  return createHash('sha256').update(str).digest('hex');
}
const hash = sha256(JSON.stringify(types));
console.log(hash);
