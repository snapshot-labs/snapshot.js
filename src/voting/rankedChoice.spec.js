import { test, expect } from 'vitest';
import RankedChoiceVoting from './rankedChoice';
import example from './examples/rankedChoice.json';

const example2 = () => {
  // Example with multiple (3) strategies
  const proposal = {
    choices: ['Alice', 'Bob', 'Carol', 'David']
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
  [[4, 2, 3, 1], '(1st) David, (2nd) Bob, (3rd) Carol, (4th) Alice']
])('getChoiceString %s %s', (selected, expected) => {
  const ranked = new RankedChoiceVoting(
    example.proposal,
    example.votes,
    example.strategies,
    selected
  );
  expect(ranked.getChoiceString()).toEqual(expected);
});
