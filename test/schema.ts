const snapshot = require('../');
const sampleSpace = require('../src/schemas/sample.json');

const valid = snapshot.utils.validateSchema(snapshot.schemas.space, sampleSpace);
console.log(valid);
