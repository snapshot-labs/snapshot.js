import { test, expect } from 'vitest';
import ApprovalVoting from './approval';
import example from './examples/approval.json';

const example2 = () => {
  // Example with multiple (3) strategies
  const proposal = {
    choices: ['Article 1', 'Article 2', 'Article 3', 'Article 4']
  };
  const strategies = [
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} }
  ];
  const scores = [771, 513, 417, 375];
  const scoresByStrategy = [
    [257, 257, 257],
    [171, 171, 171],
    [139, 139, 139],
    [125, 125, 125]
  ];
  const scoresTotal = 1218;
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
    return Math.random() < 0.9
      ? 2
      : Math.random() < 0.7
      ? -1
      : Math.random() < 0.5
      ? 1000000
      : Math.random() < 0.3
      ? 0
      : undefined;
  };
  const choices = [
    rndNumber(),
    rndNumber(),
    rndNumber(),
    rndNumber(),
    rndNumber(),
    rndNumber(),
    rndNumber()
  ];
  return choices;
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
    const approval = new ApprovalVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(approval.getScores()).toEqual(expected);
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
    const approval = new ApprovalVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(approval.getScoresByStrategy()).toEqual(expected);
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
    const approval = new ApprovalVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(approval.getScoresTotal()).toEqual(expected);
  }
);

test.each([
  [[1], 'Article 1'],
  [[1, 2, 3, 4], 'Article 1, Article 2, Article 3, Article 4']
])('getChoiceString %s %s', (selected, expected) => {
  const approval = new ApprovalVoting(
    example.proposal,
    example.votes,
    example.strategies,
    selected
  );
  expect(approval.getChoiceString()).toEqual(expected);
});
