import { test, expect } from 'vitest';
import QuadraticVoting from './quadratic';
import example from './examples/quadratic.json';

const example2 = () => {
  // Example with multiple (3) strategies
  const proposal = {
    choices: [
      'PistachioSwap',
      'Pistachio UBI',
      'ProofofPistachio',
      'iPistachio'
    ]
  };
  const strategies = [
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} },
    { name: 'ticket', network: 1, params: {} }
  ];
  const scores = [
    854.6690338964088, 135.07224932254462, 119.01320657080512, 73.24551021024158
  ];
  const scoresByStrategy = [
    [284.8896779654692, 284.8896779654692, 284.8896779654692],
    [45.02408310751502, 45.02408310751502, 45.02408310751502],
    [39.671068856935044, 39.671068856935044, 39.671068856935044],
    [24.415170070080546, 24.415170070080546, 24.415170070080546]
  ];
  const scoresTotal = 1182;
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
    const quadratic = new QuadraticVoting(
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
    const quadratic = new QuadraticVoting(
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
    const quadratic = new QuadraticVoting(
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
    '10% for PistachioSwap, 10% for Pistachio UBI, 40% for ProofOfPistachio, 40% for iPistachio'
  ],
  [
    { 1: 4, 2: 4, 3: 1, 4: 1 },
    '40% for PistachioSwap, 40% for Pistachio UBI, 10% for ProofOfPistachio, 10% for iPistachio'
  ]
])('getChoiceString %s %s', (selected, expected) => {
  const quadratic = new QuadraticVoting(
    example.proposal,
    example.votes,
    example.strategies,
    selected
  );
  expect(quadratic.getChoiceString()).toEqual(expected);
});
