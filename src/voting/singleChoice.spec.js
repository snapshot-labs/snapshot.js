import { test, expect } from 'vitest';
import SingleChoiceVoting from './singleChoice';
import example from './examples/singleChoice.json';

const example2 = () => {
  // Example with multiple (3) strategies
  const proposal = { choices: ['Alice', 'Bob', 'Carol', 'David'] };
  const strategies = [
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} }
  ];
  const scores = [1758, 222, 177, 120];
  const scoresByStrategy = [
    [586, 586, 586],
    [74, 74, 74],
    [59, 59, 59],
    [40, 40, 40]
  ];
  const scoresTotal = 2277;
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

const votesWithInvalidChoices = () => {
  const votes = [];
  for (let i = 0; i < 100; i++) {
    votes.push({
      choice: Math.random() < 0.5 ? -1 : Math.random() < 0.5 ? 1000000 : 0,
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
    const single = new SingleChoiceVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(single.getScores()).toEqual(expected);
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
    const single = new SingleChoiceVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(single.getScoresByStrategy()).toEqual(expected);
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
    const single = new SingleChoiceVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(single.getScoresTotal()).toEqual(expected);
  }
);

test.each([
  [1, 'Alice'],
  [4, 'David']
])('getChoiceString %s %s', (selected, expected) => {
  const single = new SingleChoiceVoting(
    example.proposal,
    example.votes,
    example.strategies,
    selected
  );
  expect(single.getChoiceString()).toEqual(expected);
});
