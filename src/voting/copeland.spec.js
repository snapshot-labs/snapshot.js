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

// Helper function to create example with decimal voting powers
const exampleWithDecimals = () => {
  const proposal = {
    choices: ['Alice', 'Bob', 'Carol']
  };
  const strategies = [{ name: 'ticket', network: '1', params: {} }];
  const votes = [
    { choice: [1, 2, 3], balance: 1.5, scores: [1.5] },
    { choice: [2, 1, 3], balance: 2.75, scores: [2.75] },
    { choice: [3, 2, 1], balance: 0.25, scores: [0.25] }
  ];

  return {
    proposal,
    strategies,
    votes
  };
};

// Helper function to create example with high voting powers
const exampleWithHighPowers = () => {
  const proposal = {
    choices: ['Alice', 'Bob', 'Carol']
  };
  const strategies = [{ name: 'ticket', network: '1', params: {} }];
  const votes = [
    { choice: [1, 2, 3], balance: 1000000, scores: [1000000] },
    { choice: [2, 1, 3], balance: 2500000, scores: [2500000] },
    { choice: [3, 2, 1], balance: 1500000, scores: [1500000] }
  ];

  return {
    proposal,
    strategies,
    votes
  };
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

// Add test for verifying strategy normalization
test('getScoresByStrategy normalizes correctly', () => {
  const proposal = {
    choices: ['Alice', 'Bob', 'Carol']
  };
  const strategies = [
    { name: 'ticket', network: '1', params: {} },
    { name: 'erc20-balance-of', network: '1', params: {} }
  ];
  const votes = [
    { choice: [1, 2, 3], balance: 10, scores: [5, 15] },
    { choice: [2, 3, 1], balance: 20, scores: [10, 30] },
    { choice: [3, 1, 2], balance: 15, scores: [7.5, 22.5] }
  ];

  const copeland = new CopelandVoting(proposal, votes, strategies, [1]);

  const scoresByStrategy = copeland.getScoresByStrategy();
  expect(scoresByStrategy).toMatchSnapshot();

  // Verify totals per strategy
  const strategyTotals = [22.5, 67.5]; // Sum of all votes per strategy

  // Sum the scores for each strategy
  const strategyTotalResults = [0, 0];
  for (let i = 0; i < strategies.length; i++) {
    for (let j = 0; j < proposal.choices.length; j++) {
      strategyTotalResults[i] += scoresByStrategy[j][i];
    }
  }

  // Verify total voting power is preserved for each strategy
  expect(strategyTotalResults[0]).toBeCloseTo(strategyTotals[0], 5);
  expect(strategyTotalResults[1]).toBeCloseTo(strategyTotals[1], 5);
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

test('getScores with mixed voting powers', () => {
  const proposal = {
    choices: ['Alice', 'Bob', 'Carol']
  };
  const votes = [
    { choice: [1, 2, 3], balance: 1000000.75, scores: [1000000.75] },
    { choice: [2, 3, 1], balance: 0.25, scores: [0.25] },
    { choice: [3, 1, 2], balance: 2500.5, scores: [2500.5] }
  ];
  const copeland = new CopelandVoting(proposal, votes, example.strategies, [1]);
  const scores = copeland.getScores();
  expect(scores).toMatchSnapshot();
  // Verify total voting power is preserved
  expect(scores.reduce((a, b) => a + b)).toBeCloseTo(1002501.5, 5);
});

test('getScores with 0 votes', () => {
  const proposal = {
    choices: ['Alice', 'Bob', 'Carol']
  };
  const votes = [];
  const copeland = new CopelandVoting(proposal, votes, example.strategies, [1]);
  const scores = copeland.getScores();
  expect(scores).toMatchSnapshot();
  // Verify total voting power is preserved
});
