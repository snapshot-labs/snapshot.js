import { test, expect } from 'vitest';
import CopelandVoting from './copeland';
import example from './examples/copeland.json';

// Helper function to create a more complex example with multiple strategies
const example2 = () => {
  const proposal = {
    choices: ['Alice', 'Bob', 'Carol', 'David']
  };
  const strategies = [
    { name: 'ticket', network: '1', params: {} },
    { name: 'ticket', network: '1', params: {} },
    { name: 'ticket', network: '1', params: {} }
  ];
  const votes = example.votes.map((vote) => ({
    choice: vote.choice,
    balance: 3,
    scores: [1, 1, 1]
  }));

  return {
    proposal,
    strategies,
    votes
  };
};

// Generate a set of votes including some invalid choices
const votesWithInvalidChoices = () => {
  const invalidVotes = [
    { choice: [0, 1], balance: 1, scores: [1] },
    { choice: [1, 5], balance: 1, scores: [1] },
    { choice: [1, 1], balance: 1, scores: [1] },
    { choice: [], balance: 1, scores: [1] },
    { choice: [1, 2, 3, 4, 5], balance: 1, scores: [1] }
  ];
  return [...invalidVotes, ...example.votes];
};

// Generate a set of votes including some invalid choices for the multi-strategy example
const votesWithInvalidChoices2 = () => {
  const invalidVotes = [
    { choice: [0, 1], balance: 3, scores: [1, 1, 1] },
    { choice: [1, 5], balance: 3, scores: [1, 1, 1] },
    { choice: [1, 1], balance: 3, scores: [1, 1, 1] },
    { choice: [], balance: 3, scores: [1, 1, 1] },
    { choice: [1, 2, 3, 4, 5], balance: 3, scores: [1, 1, 1] }
  ];
  return [...invalidVotes, ...example2().votes];
};

// Test cases for getScores method
test.each([
  [example.proposal, example.votes, example.strategies],
  [example.proposal, votesWithInvalidChoices(), example.strategies],
  [example2().proposal, example2().votes, example2().strategies],
  [example2().proposal, votesWithInvalidChoices2(), example2().strategies]
])('getScores', (proposal, votes, strategies) => {
  const copeland = new CopelandVoting(
    proposal,
    votes,
    strategies,
    example.selectedChoice
  );
  expect(copeland.getScores()).toMatchSnapshot();
});

// Test cases for getScoresByStrategy method
test.each([
  [example.proposal, example.votes, example.strategies],
  [example.proposal, votesWithInvalidChoices(), example.strategies],
  [example2().proposal, example2().votes, example2().strategies],
  [example2().proposal, votesWithInvalidChoices2(), example2().strategies]
])('getScoresByStrategy', (proposal, votes, strategies) => {
  const copeland = new CopelandVoting(
    proposal,
    votes,
    strategies,
    example.selectedChoice
  );
  expect(copeland.getScoresByStrategy()).toMatchSnapshot();
});

// Test cases for getScoresTotal method
test.each([
  [example.proposal, example.votes, example.strategies],
  [example2().proposal, example2().votes, example2().strategies]
])('getScoresTotal', (proposal, votes, strategies) => {
  const copeland = new CopelandVoting(
    proposal,
    votes,
    strategies,
    example.selectedChoice
  );
  expect(copeland.getScoresTotal()).toMatchSnapshot();
});

// Test cases for getChoiceString method
test.each([
  [[1, 2], 'Alice, Bob'],
  [[4, 2, 3, 1], 'David, Bob, Carol, Alice']
])('getChoiceString %s', (selected, expected) => {
  const copeland = new CopelandVoting(
    example.proposal,
    example.votes,
    example.strategies,
    selected
  );
  expect(copeland.getChoiceString()).toBe(expected);
});

// Test case for partial ranking
test('Partial ranking', () => {
  const partialVotes = [
    ...example.votes,
    {
      choice: [2, 1],
      balance: 1,
      scores: [1]
    }
  ];
  const copeland = new CopelandVoting(
    example.proposal,
    partialVotes,
    example.strategies,
    example.selectedChoice
  );
  expect(copeland.getScores()).toMatchSnapshot();
});
