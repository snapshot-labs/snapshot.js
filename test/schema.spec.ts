import { test, expect, describe } from 'vitest';
import { validateSchema } from '../src/utils';
import space from './examples/space.json';
import proposal from './examples/proposal.json';
import spaceTurbo from './examples/space-turbo.json';
import spaceStarknetDelegation from './examples/space-starknet-delegation.json';
import proposalTurbo from './examples/proposal-turbo.json';
import vote from './examples/vote.json';
import profile from './examples/profile.json';
import profileAddEmailSubscription from './examples/profile-addEmailSubscription.json';
import profileUpdateEmailSubscription from './examples/profile-updateEmailSubscription.json';
import statement from './examples/statement.json';
import alias from './examples/alias.json';
import schemas from '../src/schemas';
import proposalMaxLengthWithSpaceTypeError from './examples/proposal-maxLengthWithSpaceType-error.json';
import spaceMaxItemsWithSpaceTypeError from './examples/space-maxItemsWithSpaceType-error.json';

// Tests for default spaces
describe.each([
  { schemaType: 'space', schema: schemas.space, example: space },
  {
    schemaType: 'space',
    schema: schemas.space,
    example: spaceStarknetDelegation
  },
  { schemaType: 'proposal', schema: schemas.proposal, example: proposal },
  { schemaType: 'vote', schema: schemas.vote, example: vote },
  { schemaType: 'profile', schema: schemas.profile, example: profile },
  {
    schemaType: 'profile',
    schema: schemas.profile,
    example: profileAddEmailSubscription
  },
  {
    schemaType: 'profile',
    schema: schemas.profile,
    example: profileUpdateEmailSubscription
  },
  { schemaType: 'statement', schema: schemas.statement, example: statement },
  { schemaType: 'zodiac', schema: schemas.zodiac, example: space },
  { schemaType: 'alias', schema: schemas.alias, example: alias }
])(`Run validate for all schemas`, ({ schemaType, schema, example }) => {
  test(`validating schema ${schemaType} should return true`, () => {
    const isValid = validateSchema(schema, example, {
      snapshotEnv: 'mainnet'
    });
    expect(isValid).toBe(true);
  });
});

// Tests for turbo spaces
describe.each([
  { schemaType: 'space', schema: schemas.space, example: spaceTurbo },
  { schemaType: 'proposal', schema: schemas.proposal, example: proposalTurbo }
])(`Run validate for turbo spaces`, ({ schemaType, schema, example }) => {
  test(`validating schema ${schemaType} should return true`, () => {
    const isValid = validateSchema(schema, example, {
      snapshotEnv: 'mainnet',
      spaceType: 'turbo'
    });
    expect(isValid).toBe(true);
  });
});

// tests for default schema with turbo example, should fail
describe.each([
  {
    schemaType: 'space',
    schema: schemas.space,
    example: spaceTurbo,
    error: spaceMaxItemsWithSpaceTypeError
  },
  {
    schemaType: 'proposal',
    schema: schemas.proposal,
    example: proposalTurbo,
    error: proposalMaxLengthWithSpaceTypeError
  }
])(
  `Run validate for default schema with turbo example`,
  ({ schemaType, schema, example, error }) => {
    test(`validating schema ${schemaType} should fail with error`, () => {
      const isValid = validateSchema(schema, example, {
        snapshotEnv: 'mainnet'
      });
      expect(isValid).toMatchObject(error);
    });
  }
);
