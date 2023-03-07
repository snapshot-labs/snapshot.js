import { test, expect } from 'vitest';
import WeightedVoting from './weighted';
import example from './examples/weighted.json';

const example2 = () => {
  // Example with multiple (3) strategies
  const proposal = {
    choices: [
      'In Pistachio we believe',
      'In Pistachio Veritas',
      '42',
      'Pistachio to the Moon'
    ]
  };
  const strategies = [
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} }
  ];
  const scores = [
    1056.126494229336, 267.57865596652977, 150.23400677711683,
    155.06084302701717
  ];
  const scoresByStrategy = [
    [352.04216474311204, 352.04216474311204, 352.04216474311204],
    [89.19288532217654, 89.19288532217654, 89.19288532217654],
    [50.07800225903896, 50.07800225903896, 50.07800225903896],
    [51.68694767567244, 51.68694767567244, 51.68694767567244]
  ];
  const scoresTotal = 1629;
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
    return Math.random() < 0.3 ? -1 : undefined;
  };
  const obj = Object.assign(
    {},
    Array.from({ length: Math.floor(Math.random() * 6) + 1 }, rndNumber)
  );
  delete obj[0];
  return Math.random() < 0.9 ? obj : {};
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

const votesWithInvalidChoicesAllZeros = () => {
  return [
    ...example2().votes,
    {
      choice: { 1: 0, 2: 0, 3: 0 },
      balance: 3,
      scores: [1, 1, 1]
    }
  ];
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
  ],
  [
    example2().proposal,
    votesWithInvalidChoicesAllZeros(),
    example2().strategies,
    example2().scores
  ]
];

test.each(getScoresTests)(
  'getScores',
  (proposal, votes, strategies, expected) => {
    const quadratic = new WeightedVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(quadratic.getScores()).toEqual(expected);
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
    const quadratic = new WeightedVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(quadratic.getScoresByStrategy()).toEqual(expected);
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
    const quadratic = new WeightedVoting(
      proposal,
      votes,
      strategies,
      example.selectedChoice
    );
    expect(quadratic.getScoresTotal()).toEqual(expected);
  }
);

test.each([
  [
    { 1: 1, 2: 1, 3: 4, 4: 4 },
    '10% for In Pistachio we believe, 10% for In Pistachio Veritas, 40% for 42, 40% for Pistachio to the Moon'
  ],
  [
    { 1: 4, 2: 4, 3: 1, 4: 1 },
    '40% for In Pistachio we believe, 40% for In Pistachio Veritas, 10% for 42, 10% for Pistachio to the Moon'
  ],
  [
    { 1: 4, 4: 1 },
    '80% for In Pistachio we believe, 20% for Pistachio to the Moon'
  ]
])('getChoiceString %s %s', (selected, expected) => {
  const quadratic = new WeightedVoting(
    example.proposal,
    example.votes,
    example.strategies,
    selected
  );
  expect(quadratic.getChoiceString()).toEqual(expected);
});
