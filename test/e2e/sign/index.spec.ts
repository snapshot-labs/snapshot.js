import { describe, expect, test } from 'vitest';
const { createHash } = require('crypto');
import * as types from '../../../src/sign/types';
import hashedTypes from '../../../src/sign/hashedTypes.json';
import kebabCase from 'lodash/kebabCase';

function sha256(str) {
  return createHash('sha256').update(str).digest('hex');
}
describe('sign types', () => {
  console.log(types);
  Object.keys(types).forEach((key) => {
    test(`hashed type should contain with type ${key}`, () => {
      const hash = sha256(JSON.stringify(types[key]));
      expect(hash).toBeTruthy();
      const derivedKey = kebabCase(
        key
          .replace('2Types', '')
          .replace('Types', '')
          .replace('Type', '')
          .replace('space', 'settings')
          .replace('cancel', 'delete')
      );
      try {
        expect(hashedTypes[hash]).toBe(derivedKey);
      } catch (error) {
        throw new Error(
          `Hash ${hash} does not match the derived key ${derivedKey}`
        );
      }
    });
  });
});
