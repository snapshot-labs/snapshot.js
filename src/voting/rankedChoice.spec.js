import { test, expect, describe } from 'vitest';
import RankedChoiceVoting, { getFinalRound } from './rankedChoice';
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

test('getScoresByStrategy should handle empty scores array from getFinalRound', () => {
  // Using same votes as majority winner test where some choices have no first-place votes
  const votes = [
    { choice: [1, 2, 3, 4], balance: 100, scores: [100] }, // First: Alice
    { choice: [1, 3, 2, 4], balance: 200, scores: [200] }, // First: Alice
    { choice: [1, 4, 2, 3], balance: 150, scores: [150] }, // First: Alice
    { choice: [2, 1, 3, 4], balance: 50, scores: [50] } // First: Bob
  ];

  const proposal = { choices: TEST_CHOICES };
  const strategies = [{ name: 'ticket', network: 1, params: {} }];

  const ranked = new RankedChoiceVoting(
    proposal,
    votes,
    strategies,
    example.selectedChoice
  );

  // This should not throw an error when reduce encounters empty scores arrays
  const result = ranked.getScoresByStrategy();

  // Expected: Alice gets all her votes (450), Bob gets his (50), Carol and David get 0
  expect(result).toEqual([
    [450], // Alice: 100 + 200 + 150
    [50], // Bob: 50
    [0], // Carol: no first-place votes
    [0] // David: no first-place votes
  ]);
});

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

describe('isValidChoice', () => {
  test.each([
    [[1, 2, 3, 4], TEST_CHOICES],
    [[4, 3, 2, 1], TEST_CHOICES],
    [[2, 1, 4, 3], TEST_CHOICES],
    [[1], ['Alice']]
  ])('should accept valid ranked choice: %s', (voteChoice, proposalChoices) => {
    expect(RankedChoiceVoting.isValidChoice(voteChoice, proposalChoices)).toBe(
      true
    );
  });

  test.each([
    ['not-array', TEST_CHOICES],
    [null, TEST_CHOICES],
    [undefined, TEST_CHOICES]
  ])('should reject non-array input: %s', (voteChoice, proposalChoices) => {
    expect(RankedChoiceVoting.isValidChoice(voteChoice, proposalChoices)).toBe(
      false
    );
  });

  test.each([
    [[], TEST_CHOICES],
    [[], []]
  ])('should reject empty choice array: %s', (voteChoice, proposalChoices) => {
    expect(RankedChoiceVoting.isValidChoice(voteChoice, proposalChoices)).toBe(
      false
    );
  });

  test.each([
    [[1, 5], TEST_CHOICES],
    [[0, 1, 2, 3, 4], TEST_CHOICES],
    [[-1, 1, 2, 3], TEST_CHOICES],
    [[100], TEST_CHOICES]
  ])(
    'should reject out-of-range indices: %s',
    (voteChoice, proposalChoices) => {
      expect(
        RankedChoiceVoting.isValidChoice(voteChoice, proposalChoices)
      ).toBe(false);
    }
  );

  test.each([
    [[1, 1, 2, 3], TEST_CHOICES],
    [[1, 2, 2, 3], TEST_CHOICES],
    [
      [1, 1],
      ['Alice', 'Bob']
    ]
  ])('should reject duplicate choices: %s', (voteChoice, proposalChoices) => {
    expect(RankedChoiceVoting.isValidChoice(voteChoice, proposalChoices)).toBe(
      false
    );
  });

  test.each([
    [[1], TEST_CHOICES],
    [[1, 2], TEST_CHOICES]
  ])(
    'should reject incomplete ranking when multiple choices available: %s',
    (voteChoice, proposalChoices) => {
      expect(
        RankedChoiceVoting.isValidChoice(voteChoice, proposalChoices)
      ).toBe(false);
    }
  );
});

describe('getFinalRound', () => {
  test('should execute instant runoff voting with multiple elimination rounds', () => {
    const votes = [
      { choice: [1, 2, 3, 4], balance: 100, scores: [100] }, // First: Alice
      { choice: [2, 1, 3, 4], balance: 200, scores: [200] }, // First: Bob
      { choice: [3, 1, 2, 4], balance: 150, scores: [150] }, // First: Carol
      { choice: [4, 1, 2, 3], balance: 50, scores: [50] } // First: David
    ];

    const result = getFinalRound(votes);

    expect(result).toEqual([
      ['2', [350, [350]]], // Bob wins with 350 total (200+150 after IRV)
      ['3', [150, [150]]] // Carol second with 150
    ]);
  });

  test('should handle choices with no first-place votes', () => {
    const votes = [
      { choice: [1, 2, 3, 4], balance: 100, scores: [100] }, // First: Alice
      { choice: [1, 3, 2, 4], balance: 200, scores: [200] }, // First: Alice
      { choice: [2, 1, 3, 4], balance: 150, scores: [150] }, // First: Bob
      { choice: [2, 3, 1, 4], balance: 300, scores: [300] } // First: Bob
    ];

    const result = getFinalRound(votes);

    expect(result).toEqual([
      ['2', [450, [450]]], // Bob wins with 450 (150+300)
      ['1', [300, [300]]], // Alice second with 300 (100+200)
      ['3', [0, []]], // Carol has no first place votes - empty scores array (our fix)
      ['4', [0, []]] // David has no first place votes - empty scores array (our fix)
    ]);
  });

  test('should declare winner in first round when candidate has majority', () => {
    const votes = [
      { choice: [1, 2, 3, 4], balance: 100, scores: [100] }, // First: Alice
      { choice: [1, 3, 2, 4], balance: 200, scores: [200] }, // First: Alice
      { choice: [1, 4, 2, 3], balance: 150, scores: [150] }, // First: Alice
      { choice: [2, 1, 3, 4], balance: 50, scores: [50] } // First: Bob
    ];

    const result = getFinalRound(votes);

    expect(result).toEqual([
      ['1', [450, [450]]], // Alice wins with majority in round 1 (100+200+150)
      ['2', [50, [50]]], // Bob gets remaining votes
      ['3', [0, []]], // Carol has no first place votes
      ['4', [0, []]] // David has no first place votes
    ]);
  });
});
