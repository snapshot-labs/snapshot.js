import { getNumberWithOrdinal } from '../utils';

function filterVotesWithInvalidChoice(votes, choices) {
  return votes.filter((vote) => {
    return (
      Array.isArray(vote.choice) &&
      // If choice index is not in choices, return false
      vote.choice.every((choice) => choices?.[choice - 1] !== undefined) &&
      // If any choice is duplicated, return false
      vote.choice.length === new Set(vote.choice).size &&
      // If not all choices are selected, return false
      // TODO: We should add support for pacial bailout in the future
      vote.choice.length === choices.length
    );
  });
}

function irv(ballots: (number | number[])[][], rounds) {
  const candidates: any[] = [...new Set(ballots.map((vote) => vote[0]).flat())];
  const votes = Object.entries(
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

  const votesWithoutScore = votes.map((vote: any) => [vote[0], vote[1][0]]);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [topCand, topCount]: number[] = votesWithoutScore.reduce(
    ([n, m]: any[], [v, c]: any[]) => (c > m ? [v, c] : [n, m]),
    ['?', -Infinity]
  );
  const [bottomCand, bottomCount] = votesWithoutScore.reduce(
    ([n, m]: any, [v, c]: any) => (c < m ? [v, c] : [n, m]),
    ['?', Infinity]
  );
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const sortedByHighest = votes.sort((a: any, b: any) => b[1][0] - a[1][0]);

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

function getFinalRound(i, votes) {
  const results = irv(
    votes.map((vote) => [vote.choice, vote.balance, vote.scores]),
    []
  );
  const finalRound = results[results.length - 1];
  return finalRound.sortedByHighest.filter((res: any) => res[0] == i + 1);
}

export default class RankedChoiceVoting {
  proposal: { choices: string[] };
  votes: { choice: number[]; balance: number; scores: number[] }[];
  strategies: {
    name: string;
    network: string;
    params: Record<string, unknown>;
  }[];
  selected: number[];

  constructor(proposal, votes, strategies, selected) {
    this.proposal = proposal;
    this.votes = votes;
    this.strategies = strategies;
    this.selected = selected;
  }

  getValidatedVotes(): {
    choice: number[];
    balance: number;
    scores: number[];
  }[] {
    return filterVotesWithInvalidChoice(this.votes, this.proposal.choices);
  }

  getScores(): number[] {
    return this.proposal.choices.map((choice, i) =>
      getFinalRound(i, this.getValidatedVotes()).reduce(
        (a, b) => a + b[1][0],
        0
      )
    );
  }

  getScoresByStrategy(): number[][] {
    return this.proposal.choices.map((choice, i) =>
      this.strategies.map((strategy, sI) => {
        return getFinalRound(i, this.getValidatedVotes()).reduce(
          (a, b) => a + b[1][1][sI],
          0
        );
      })
    );
  }

  getScoresTotal(): number {
    return this.getScores().reduce((a, b) => a + b);
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
