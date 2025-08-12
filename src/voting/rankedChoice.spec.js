import { test, expect } from 'vitest';
import RankedChoiceVoting from './rankedChoice';
import example from './examples/rankedChoice.json';

const TEST_CHOICES = ['Alice', 'Bob', 'Carol', 'David'];

const example2 = () => {
  // Example with multiple (3) strategies
  const proposal = {
    choices: TEST_CHOICES
  };
  const strategies = [
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} }
  ];
  const scores = [351, 0, 240, 0];
  const scoresByStrategy = [
    [117, 117, 117],
    [0, 0, 0],
    [80, 80, 80],
    [0, 0, 0]
  ];
  const scoresTotal = 591;
  const votes = example.votes.map((vote) => ({
    choice: vote.choice,
    balance: 3,
    scores: [1, 1, 1]
  }));
  return {
    proposal,
    strategies,
    scores,
    scoresByStrategy,
    scoresTotal,
    votes
  };
};

const rndChoices = () => {
  const rndNumber = () => {
    return Math.random() < 0.1
      ? 2
      : Math.random() < 0.3
      ? -1
      : Math.random() < 0.5
      ? 1000000
      : Math.random() < 0.7
      ? 0
      : undefined;
  };
  const choice = Array.from(
    { length: Math.floor(Math.random() * 9) + 1 },
    rndNumber
  );
  return Math.random() < 0.9 ? choice : [];
};

const votesWithInvalidChoices = () => {
  const votes = [];
  for (let i = 0; i < 100; i++) {
    votes.push({
      choice: rndChoices(),
      balance: 1,
      scores: [1]
    });
  }
  return [...votes, ...example.votes];
};

const votesWithInvalidChoices2 = () => {
  const votes = [];
  for (let i = 0; i < 100; i++) {
    votes.push({
      choice: rndChoices(),
      balance: 3,
      scores: [1, 1, 1]
    });
  }
  return [...votes, ...example2().votes];
};

const getScoresTests = [
  [example.proposal, example.votes, example.strategies, example.scores],
  [
    example.proposal,
    votesWithInvalidChoices(),
    example.strategies,
    example.scores
  ],
  [
    example2().proposal,
    example2().votes,
    example2().strategies,
    example2().scores
  ],
  [
    example2().proposal,
    votesWithInvalidChoices2(),
    example2().strategies,
    example2().scores
  ]
];

test.each(getScoresTests)(
  'getScores',
  (proposal, votes, strategies, expected) => {
    const ranked = new RankedChoiceVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(ranked.getScores()).toEqual(expected);
  }
);

const getScoresByStrategyTests = [
  [
    example.proposal,
    example.votes,
    example.strategies,
    example.scoresByStrategy
  ],
  [
    example.proposal,
    votesWithInvalidChoices(),
    example.strategies,
    example.scoresByStrategy
  ],
  [
    example2().proposal,
    example2().votes,
    example2().strategies,
    example2().scoresByStrategy
  ],
  [
    example2().proposal,
    votesWithInvalidChoices2(),
    example2().strategies,
    example2().scoresByStrategy
  ]
];

test.each(getScoresByStrategyTests)(
  'getScoresByStrategy',
  (proposal, votes, strategies, expected) => {
    const ranked = new RankedChoiceVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(ranked.getScoresByStrategy()).toEqual(expected);
  }
);

const getScoresTotalTests = [
  [example.proposal, example.votes, example.strategies, example.scoresTotal],
  [
    example2().proposal,
    example2().votes,
    example2().strategies,
    example2().scoresTotal
  ]
];

test.each(getScoresTotalTests)(
  'getScoresTotal',
  (proposal, votes, strategies, expected) => {
    const ranked = new RankedChoiceVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(ranked.getScoresTotal()).toEqual(expected);
  }
);

test.each([
  [[1, 2, 3, 4], '(1st) Alice, (2nd) Bob, (3rd) Carol, (4th) David'],
  [[4, 2, 3, 1], '(1st) David, (2nd) Bob, (3rd) Carol, (4th) Alice'],
  // Invalid choices (out of range indices)
  [[5], ''], // Choice index 5 doesn't exist (only 1-4 available)
  [[0], ''], // Choice index 0 is invalid (choices are 1-indexed)
  [[-1], ''], // Negative choice index
  [[1, 5], '(1st) Alice'], // Mix of valid (1) and invalid (5) - invalid filtered out
  [[0, 2], '(1st) Bob'], // Mix of invalid (0) and valid (2) - invalid filtered out
  [[5, 6, 7], ''], // All invalid indices - all filtered out
  [[1, 0, 3], '(1st) Alice, (2nd) Carol'], // Valid-invalid-valid pattern - invalid filtered out
  [[100], ''], // Very high invalid index
  [[], ''] // Empty array
])('getChoiceString %s %s', (selected, expected) => {
  const ranked = new RankedChoiceVoting(
    example.proposal,
    example.votes,
    example.strategies,
    selected
  );
  expect(ranked.getChoiceString()).toEqual(expected);
});

const isValidChoiceTests = [
  // Valid cases
  [[1, 2, 3, 4], TEST_CHOICES, true], // All choices in order
  [[4, 3, 2, 1], TEST_CHOICES, true], // All choices reverse order
  [[2, 1, 4, 3], TEST_CHOICES, true], // All choices mixed order

  // Invalid: not an array
  ['not-array', TEST_CHOICES, false],
  [null, TEST_CHOICES, false],
  [undefined, TEST_CHOICES, false],

  // Invalid: empty array
  [[], TEST_CHOICES, false],

  // Invalid: out of range indices
  [[1, 5], TEST_CHOICES, false], // Index 5 doesn't exist
  [[0, 1, 2, 3, 4], TEST_CHOICES, false], // Index 0 is invalid (1-indexed)
  [[-1, 1, 2, 3], TEST_CHOICES, false], // Negative index
  [[100], TEST_CHOICES, false], // Very high invalid index

  // Invalid: duplicate choices
  [[1, 1, 2, 3], TEST_CHOICES, false], // Duplicate 1
  [[1, 2, 2, 3], TEST_CHOICES, false], // Duplicate 2
  [[1, 1], ['Alice', 'Bob'], false], // Duplicate in partial

  // Invalid: partial selection (not all choices selected)
  [[1], TEST_CHOICES, false], // Only 1 of 4 choices
  [[1, 2], TEST_CHOICES, false], // Only 2 of 4 choices

  // Edge cases
  [[1], ['Alice'], true], // Single choice valid - only case where partial is valid
  [[], [], false] // Empty choices and empty vote (still invalid due to empty array check)
];

test.each(isValidChoiceTests)(
  'isValidChoice %s %s -> %s',
  (voteChoice, proposalChoices, expected) => {
    expect(RankedChoiceVoting.isValidChoice(voteChoice, proposalChoices)).toBe(
      expected
    );
  }
);
