import { test, expect, describe } from 'vitest';
import { validateSchema } from '../src/utils';
import space from './examples/space.json';
import proposal from './examples/proposal.json';
import vote from './examples/vote.json';
import profile from './examples/profile.json';
import schemas from '../src/schemas';

describe.each([
  { schemaType: 'space', schema: schemas.space, example: space },
  { schemaType: 'proposal', schema: schemas.proposal, example: proposal },
  { schemaType: 'vote', schema: schemas.vote, example: vote },
  { schemaType: 'profile', schema: schemas.profile, example: profile },
  { schemaType: 'zodiac', schema: schemas.zodiac, example: space }
])(`Run validate for all schemas`, ({ schemaType, schema, example }) => {
  test(`validating schema ${schemaType} should return true`, () => {
    const isValid = validateSchema(schema, example);
    expect(isValid).toBe(true);
  });
});
