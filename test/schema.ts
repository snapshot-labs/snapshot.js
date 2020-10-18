const Ajv = require('ajv'); // ajv@beta
const spaceSchema = require('../src/schemas/space.json');
const sample = require('../src/schemas/sample.json');

const ajv = new Ajv();
const validate = ajv.compile(spaceSchema.definitions.Space)
const valid = validate(sample);

console.log(valid, validate.errors);
