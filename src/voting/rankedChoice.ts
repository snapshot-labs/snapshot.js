import { getNumberWithOrdinal } from '../utils';
import { RankedChoiceVote, Strategy } from './types';

function irv(
  ballots: (number | number[])[][],
  rounds: {
    round: number;
    sortedByHighest: [string, [number, number[]]][];
  }[]
): { round: number; sortedByHighest: [string, [number, number[]]][] }[] {
  const candidates: number[] = [
    ...new Set(ballots.map((vote) => vote[0]).flat())
  ];
  const votes: [string, [number, number[]]][] = Object.entries(
    ballots.reduce((votes, [v], i, src) => {
      const balance = src[i][1];
      votes[v[0]][0] += balance;

      const score = src[i][2] as number[];
      if (score.length > 1) {
        votes[v[0]][1] = score.map((s, sI) => s + votes[v[0]][1][sI] || s);
      } else
        votes[v[0]][1] = [
          votes[v[0]][1].concat(score).reduce((a, b) => a + b, 0)
        ];
      return votes;
    }, Object.assign({}, ...candidates.map((c) => ({ [c]: [0, []] }))))
  );

  const votesWithoutScore = votes.map((vote) => [vote[0], vote[1][0]]);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [topCand, topCount]: number[] = votesWithoutScore.reduce(
    ([n, m]: any[], [v, c]: any[]) => (c > m ? [v, c] : [n, m]),
    ['?', -Infinity]
  );
  const [bottomCand, bottomCount] = votesWithoutScore.reduce(
    ([n, m], [v, c]) => (c < m ? [v, c] : [n, m]),
    ['?', Infinity]
  );
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const sortedByHighest = votes.sort((a, b) => b[1][0] - a[1][0]);

  const totalPowerOfVotes = ballots
    .map((bal) => bal[1])
    .reduce((a, b: any) => a + b, 0);

  rounds.push({
    round: rounds.length + 1,
    sortedByHighest
  });

  return topCount > (totalPowerOfVotes as number) / 2 ||
    sortedByHighest.length < 3
    ? rounds
    : irv(
        ballots
          .map((ballot) => [
            (ballot[0] as number[]).filter((c) => c != bottomCand),
            ballot[1],
            ballot[2]
          ])
          .filter((ballot) => (ballot[0] as number[]).length > 0),
        rounds
      );
}

function getFinalRound(
  votes: RankedChoiceVote[]
): [string, [number, number[]]][] {
  const rounds = irv(
    votes.map((vote) => [vote.choice, vote.balance, vote.scores]),
    []
  );
  const finalRound = rounds[rounds.length - 1];
  return finalRound.sortedByHighest;
}

function getScoresMethod(
  votes: RankedChoiceVote[],
  proposal: { choices: string[] }
) {
  const finalRound = getFinalRound(votes);
  return proposal.choices.map((choice, i) =>
    finalRound
      .filter((res) => Number(res[0]) === i + 1)
      .reduce((a, b) => a + b[1][0], 0)
  );
}

export default class RankedChoiceVoting {
  proposal: { choices: string[] };
  votes: RankedChoiceVote[];
  strategies: Strategy[];
  selected: number[];

  constructor(
    proposal: { choices: string[] },
    votes: RankedChoiceVote[],
    strategies: Strategy[],
    selected: number[]
  ) {
    this.proposal = proposal;
    this.votes = votes;
    this.strategies = strategies;
    this.selected = selected;
  }

  static isValidChoice(
    voteChoice: number[],
    proposalChoices: string[]
  ): boolean {
    return (
      Array.isArray(voteChoice) &&
      // If voteChoice index is not in choices, return false
      voteChoice.every(
        (voteChoice) => proposalChoices?.[voteChoice - 1] !== undefined
      ) &&
      // If any voteChoice is duplicated, return false
      voteChoice.length === new Set(voteChoice).size &&
      // If voteChoice is empty, return false
      voteChoice.length > 0 &&
      // If not all proposalChoices are selected, return false
      // TODO: We should add support for pacial bailout in the future
      voteChoice.length === proposalChoices.length
    );
  }

  getValidVotes(): RankedChoiceVote[] {
    return this.votes.filter((vote) =>
      RankedChoiceVoting.isValidChoice(vote.choice, this.proposal.choices)
    );
  }

  getScores(): number[] {
    return getScoresMethod(this.getValidVotes(), this.proposal);
  }

  getScoresByStrategy(): number[][] {
    const finalRound = getFinalRound(this.getValidVotes());
    return this.proposal.choices.map((choice, i) =>
      this.strategies.map((strategy, sI) => {
        return finalRound
          .filter((res) => Number(res[0]) === i + 1)
          .reduce((a, b) => a + b[1][1][sI], 0);
      })
    );
  }

  getScoresTotal(): number {
    return this.votes.reduce((a, b: any) => a + b.balance, 0);
  }

  getChoiceString(): string {
    return this.selected
      .map((choice) => {
        if (this.proposal.choices[choice - 1])
          return this.proposal.choices[choice - 1];
      })
      .map((el, i) => `(${getNumberWithOrdinal(i + 1)}) ${el}`)
      .join(', ');
  }
}
