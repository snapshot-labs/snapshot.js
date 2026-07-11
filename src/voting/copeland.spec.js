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

// Partial ballots must be rejected: Copeland requires a full ranking of every
// choice. Adding a partial ballot must not change the outcome, because the
// partial vote is filtered out by getValidVotes().
test('Partial ballots are rejected (filtered out)', () => {
  const fullPermutationVotes = [
    { choice: [1, 2, 3, 4], balance: 1, scores: [1] },
    { choice: [2, 1, 3, 4], balance: 1, scores: [1] },
    { choice: [1, 3, 2, 4], balance: 1, scores: [1] }
  ];

  const baseline = new CopelandVoting(
    example.proposal,
    fullPermutationVotes,
    example.strategies,
    example.selectedChoice
  );

  const withPartial = new CopelandVoting(
    example.proposal,
    [...fullPermutationVotes, { choice: [2, 1], balance: 1, scores: [1] }],
    example.strategies,
    example.selectedChoice
  );

  // The partial ballot is ignored, so scores and totals are unchanged.
  expect(withPartial.getValidVotes()).toHaveLength(fullPermutationVotes.length);
  expect(withPartial.getScores()).toEqual(baseline.getScores());
  expect(withPartial.getScoresTotal()).toBe(baseline.getScoresTotal());
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

test('getScores breaks victory ties by average support', () => {
  const proposal = {
    choices: ['Alice', 'Bob', 'Carol']
  };
  // Alice and Bob each beat Carol and tie head-to-head, so they finish level on
  // pairwise victories and cannot be separated by victories alone. Alice beats
  // Carol by the wider margin, so she has the higher average support and must
  // rank first. Bob (choice 2) is also listed after Alice (choice 1), so this
  // only holds if average support, not choice-list order, breaks the tie.
  const votes = [
    { choice: [1, 2, 3], balance: 20, scores: [20] }, // Alice > Bob > Carol
    { choice: [1, 3, 2], balance: 15, scores: [15] }, // Alice > Carol > Bob
    { choice: [2, 1, 3], balance: 20, scores: [20] }, // Bob > Alice > Carol
    { choice: [2, 3, 1], balance: 5, scores: [5] }, //  Bob > Carol > Alice
    { choice: [3, 2, 1], balance: 10, scores: [10] } // Carol > Bob > Alice
  ];
  const scores = new CopelandVoting(proposal, votes, example.strategies, [
    1
  ]).getScores();

  expect(scores[0]).toBeGreaterThan(scores[1]); // Alice over Bob, on support
  expect(scores[1]).toBeGreaterThan(scores[2]); // Bob over Carol

  // Swapping Alice and Bob on every ballot must flip the tiebreak. This proves
  // the order follows average support, not the choices' position in the list.
  const swapped = votes.map((vote) => ({
    ...vote,
    choice: vote.choice.map((c) => (c === 1 ? 2 : c === 2 ? 1 : c))
  }));
  const swappedScores = new CopelandVoting(
    proposal,
    swapped,
    example.strategies,
    [1]
  ).getScores();

  expect(swappedScores[1]).toBeGreaterThan(swappedScores[0]); // now Bob leads
  expect(swappedScores[0]).toBeGreaterThan(swappedScores[2]); // Alice over Carol
});

test('getScoresByStrategy columns sum to getScores when strategies are proportional', () => {
  const proposal = {
    choices: ['Alice', 'Bob', 'Carol']
  };
  const strategies = [
    { name: 's1', network: '1', params: {} },
    { name: 's2', network: '1', params: {} }
  ];
  // Alice and Bob tie on victories, so the average-support bonus is active. Each
  // ballot's voting power is split 70/30 across the two strategies, so neither
  // strategy flips a pairwise sign and the columns decompose the headline
  // exactly. Without the same bonus in getScoresByStrategy the rows would not
  // add up (e.g. a Condorcet loser would show all-zero columns under a nonzero
  // headline).
  const votes = [40, 40, 30, 30].map((balance, index) => ({
    choice: [
      [1, 2, 3],
      [2, 1, 3],
      [1, 3, 2],
      [3, 2, 1]
    ][index],
    balance,
    scores: [balance * 0.7, balance * 0.3]
  }));
  const copeland = new CopelandVoting(proposal, votes, strategies, [1]);
  const scores = copeland.getScores();
  const scoresByStrategy = copeland.getScoresByStrategy();

  scores.forEach((headline, choiceIndex) => {
    const rowSum = scoresByStrategy[choiceIndex].reduce(
      (sum, cell) => sum + cell,
      0
    );
    expect(rowSum).toBeCloseTo(headline, 8);
  });

  // The tiebreak is actually engaged: Alice and Bob tie on victories but Alice
  // carries more support, so her headline is higher and her columns follow.
  expect(scores[0]).toBeGreaterThan(scores[1]);
});

test('getScoresByStrategy columns diverge from getScores when strategies are not sign-collinear', () => {
  const proposal = {
    choices: ['Alice', 'Bob', 'Carol']
  };
  const strategies = [
    { name: 's1', network: '1', params: {} },
    { name: 's2', network: '1', params: {} }
  ];
  // Alice sweeps first on every ballot, while Bob and Bob-vs-Carol nets to a tie,
  // so the headline is [40, 10, 10] and the average-support bonus is engaged for
  // the Bob/Carol tie. But s1 sees only the B>C ballot and s2 the C>B ballots, so
  // the strategies flip the Bob/Carol pairwise sign relative to the total. That
  // nonlinearity means the per-strategy columns do NOT sum back to the headline.
  const votes = [
    { choice: [1, 2, 3], balance: 10, scores: [0, 10] },
    { choice: [1, 2, 3], balance: 20, scores: [20, 0] },
    { choice: [1, 3, 2], balance: 30, scores: [0, 30] }
  ];
  const copeland = new CopelandVoting(proposal, votes, strategies, [1]);
  const scores = copeland.getScores();
  const scoresByStrategy = copeland.getScoresByStrategy();
  const total = copeland.getScoresTotal();

  const rowSums = scoresByStrategy.map((row) =>
    row.reduce((sum, cell) => sum + cell, 0)
  );

  // The divergence is real: at least one choice's columns do not sum to its
  // headline (this is inherent Copeland nonlinearity across strategies, not a bug).
  const diverges = scores.some(
    (headline, i) => Math.abs(rowSums[i] - headline) > 1e-6
  );
  expect(diverges).toBe(true);

  // Totals are still preserved on both views: headline and per-strategy columns
  // each redistribute exactly the total voting power.
  const headlineTotal = scores.reduce((sum, s) => sum + s, 0);
  const strategyGrandTotal = rowSums.reduce((sum, s) => sum + s, 0);
  expect(headlineTotal).toBeCloseTo(total, 8);
  expect(strategyGrandTotal).toBeCloseTo(total, 8);
});
