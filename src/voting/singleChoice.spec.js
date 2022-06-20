import SingleChoiceVoting from './singleChoice';
import { test, expect } from 'vitest';

const choicesTwo = { choices: ['1', '2'] };
const choicesFive = { choices: ['1', '2', '3', '4', '5'] };

const votesWithOneStrategy = [
  { choice: 1, balance: 1, scores: [1] },
  { choice: 2, balance: 1, scores: [1] },
  { choice: 1, balance: 1, scores: [1] }
];
const votesWithThreeeStrategy = [
  { choice: 1, balance: 3, scores: [1, 1, 1] },
  { choice: 2, balance: 3, scores: [1, 1, 1] },
  { choice: 1, balance: 3, scores: [1, 1, 1] }
];

const strategyOne = [{ name: 'ticket', network: 1, params: {} }];
const strategyThree = [
  { name: 'ticket', network: 1, params: {} },
  { name: 'ticket', network: 1, params: {} },
  { name: 'ticket', network: 1, params: {} }
];

const getProposalResultsTable = [
  [choicesTwo, votesWithOneStrategy, strategyOne, [2, 1]],
  [choicesFive, votesWithOneStrategy, strategyOne, [2, 1, 0, 0, 0]],
  [choicesTwo, votesWithThreeeStrategy, strategyThree, [6, 3]],
  [choicesFive, votesWithThreeeStrategy, strategyThree, [6, 3, 0, 0, 0]]
];

test.each(getProposalResultsTable)(
  'getProposalResults',
  (proposal, votes, strategies, expected) => {
    const single = new SingleChoiceVoting(proposal, votes, strategies, 1);
    expect(single.getProposalResults()).toEqual(expected);
  }
);

const getProposalResultsByStrategyTable = [
  [choicesTwo, votesWithOneStrategy, strategyOne, [[2], [1]]],
  [choicesFive, votesWithOneStrategy, strategyOne, [[2], [1], [0], [0], [0]]],
  [
    choicesTwo,
    votesWithThreeeStrategy,
    strategyThree,
    [
      [2, 2, 2],
      [1, 1, 1]
    ]
  ],
  [
    choicesFive,
    votesWithThreeeStrategy,
    strategyThree,
    [
      [2, 2, 2],
      [1, 1, 1],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]
  ]
];

test.each(getProposalResultsByStrategyTable)(
  'getProposalResultsByStrategyTable',
  (proposal, votes, strategies, expected) => {
    const single = new SingleChoiceVoting(proposal, votes, strategies, 1);
    expect(single.getProposalResultsByStrategy()).toEqual(expected);
  }
);

const getProposalResultsSum = [
  [choicesTwo, votesWithOneStrategy, strategyOne, 3],
  [choicesFive, votesWithOneStrategy, strategyOne, 3],
  [choicesTwo, votesWithThreeeStrategy, strategyThree, 9],
  [choicesFive, votesWithThreeeStrategy, strategyThree, 9]
];

test.each(getProposalResultsSum)(
  'getProposalResultsSum',
  (proposal, votes, strategies, expected) => {
    const single = new SingleChoiceVoting(proposal, votes, strategies, 1);
    expect(single.getProposalResultsSum()).toEqual(expected);
  }
);

test('getChoiceString', () => {
  const single = new SingleChoiceVoting(
    choicesFive,
    votesWithOneStrategy,
    strategyOne,
    1
  );
  expect(single.getChoiceString()).toEqual('1');
});
