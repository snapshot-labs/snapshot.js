import { test, expect, describe } from 'vitest';
import { validateSchema } from '../src/utils';
import space from './examples/space.json';
import proposal from './examples/proposal.json';
import spaceTurbo from './examples/space-turbo.json';
import spaceStarknetDelegation from './examples/space-starknet-delegation.json';
import spaceStarknetNetwork from './examples/space-starknet-network.json';
import spaceStarknetStrategies from './examples/space-starknet-strategies.json';
import proposalTurbo from './examples/proposal-turbo.json';
import vote from './examples/vote.json';
import profile from './examples/profile.json';
import statement from './examples/statement.json';
import alias from './examples/alias.json';
import schemas from '../src/schemas';

// Tests for default spaces
describe.each([
  { schemaType: 'space', schema: schemas.space, example: space },
  {
    schemaType: 'space with starknet delegation',
    schema: schemas.space,
    example: spaceStarknetDelegation
  },
  {
    schemaType: 'space with starknet network',
    schema: schemas.space,
    example: spaceStarknetNetwork
  },
  {
    schemaType: 'space with starknet strategies',
    schema: schemas.space,
    example: spaceStarknetStrategies
  },
  { schemaType: 'proposal', schema: schemas.proposal, example: proposal },
  { schemaType: 'vote', schema: schemas.vote, example: vote },
  { schemaType: 'profile', schema: schemas.profile, example: profile },
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
