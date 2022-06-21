import { test, expect } from 'vitest';
import SingleChoiceVoting from './singleChoice';
import example from './examples/singleChoice.json';

const example2 = () => {
  // Exmaple with multiple (3) stratgies
  const proposal = { choices: ['Alice', 'Bob', 'Carol', 'David'] };
  const strategies = [
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} }
  ];
  const results = [1758, 222, 177, 120];
  const resultsByStrategy = [
    [586, 586, 586],
    [74, 74, 74],
    [59, 59, 59],
    [40, 40, 40]
  ];
  const resultsSum = 2277;
  const votes = example.votes.map((vote) => ({
    choice: vote.choice,
    balance: 3,
    scores: [1, 1, 1]
  }));

  return {
    proposal,
    strategies,
    results,
    resultsByStrategy,
    resultsSum,
    votes
  };
};

const votesWithInvalidChoices = () => {
  const votes = [];
  for (let i = 0; i < 100; i++) {
    votes.push({
      choice: [Math.random() < 0.5 ? -1 : Math.random() < 0.5 ? 1000000 : 0],
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
      choice: [Math.random() < 0.5 ? -1 : Math.random() < 0.5 ? 1000000 : 0],
      balance: 3,
      scores: [1, 1, 1]
    });
  }
  return [...votes, ...example2().votes];
};

const getScoresTests = [
  [example.proposal, example.votes, example.strategies, example.results],
  [
    example.proposal,
    votesWithInvalidChoices(),
    example.strategies,
    example.results
  ],
  [
    example2().proposal,
    example2().votes,
    example2().strategies,
    example2().results
  ],
  [
    example2().proposal,
    votesWithInvalidChoices2(),
    example2().strategies,
    example2().results
  ]
];

test.each(getScoresTests)(
  'getScores',
  (proposal, votes, strategies, expected) => {
    const single = new SingleChoiceVoting(proposal, votes, strategies, 1);
    expect(single.getScores()).toEqual(expected);
  }
);

const getScoresByStrategyTests = [
  [
    example.proposal,
    example.votes,
    example.strategies,
    example.resultsByStrategy
  ],
  [
    example.proposal,
    votesWithInvalidChoices(),
    example.strategies,
    example.resultsByStrategy
  ],
  [
    example2().proposal,
    example2().votes,
    example2().strategies,
    example2().resultsByStrategy
  ],
  [
    example2().proposal,
    votesWithInvalidChoices2(),
    example2().strategies,
    example2().resultsByStrategy
  ]
];

test.each(getScoresByStrategyTests)(
  'getScoresByStrategy',
  (proposal, votes, strategies, expected) => {
    const single = new SingleChoiceVoting(proposal, votes, strategies, 1);
    expect(single.getScoresByStrategy()).toEqual(expected);
  }
);

const getScoresTotalTests = [
  [example.proposal, example.votes, example.strategies, example.resultsSum],
  [
    example.proposal,
    votesWithInvalidChoices(),
    example.strategies,
    example.resultsSum
  ],
  [
    example2().proposal,
    example2().votes,
    example2().strategies,
    example2().resultsSum
  ],
  [
    example2().proposal,
    votesWithInvalidChoices2(),
    example2().strategies,
    example2().resultsSum
  ]
];

test.each(getScoresTotalTests)(
  'getScoresTotal',
  (proposal, votes, strategies, expected) => {
    const single = new SingleChoiceVoting(proposal, votes, strategies, 1);
    expect(single.getScoresTotal()).toEqual(expected);
  }
);

test('getChoiceString', () => {
  const single = new SingleChoiceVoting(
    example.proposal,
    example.votes,
    example.strategies,
    example.selectedChoice
  );
  expect(single.getChoiceString()).toEqual(
    example.proposal.choices[example.selectedChoice - 1]
  );
});
