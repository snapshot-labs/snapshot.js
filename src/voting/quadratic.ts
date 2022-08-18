import { QuadraticVote, Strategy } from './types';

export function percentageOfTotal(i, values, total): number {
  const reducedTotal: any = total.reduce((a: any, b: any) => a + b, 0);
  const percent = (values[i] / reducedTotal) * 100;
  return isNaN(percent) ? 0 : percent;
}

export function quadraticMath(i, choice, balance): number {
  return Math.sqrt(
    (percentageOfTotal(i + 1, choice, Object.values(choice)) / 100) * balance
  );
}

export default class QuadraticVoting {
  proposal: { choices: string[] };
  votes: QuadraticVote[];
  strategies: Strategy[];
  selected: { [key: string]: number };

  constructor(
    proposal: { choices: string[] },
    votes: QuadraticVote[],
    strategies: Strategy[],
    selected: { [key: string]: number }
  ) {
    this.proposal = proposal;
    this.votes = votes;
    this.strategies = strategies;
    this.selected = selected;
  }

  static isValidChoice(
    voteChoice: { [key: string]: number },
    proposalChoices: string[]
  ): boolean {
    return (
      typeof voteChoice === 'object' &&
      !Array.isArray(voteChoice) &&
      voteChoice !== null &&
      // If voteChoice object keys are not in choices, return false
      Object.keys(voteChoice).every(
        (key) => proposalChoices?.[Number(key) - 1] !== undefined
      ) &&
      // If voteChoice object is empty, return false
      Object.keys(voteChoice).length > 0 &&
      // If voteChoice object values have a negative number, return false
      Object.values(voteChoice).every(
        (value) => typeof value === 'number' && value >= 0
      ) &&
      // If voteChoice doesn't have any positive value, return false
      Object.values(voteChoice).some(
        (value) => typeof value === 'number' && value > 0
      )
    );
  }

  getValidVotes(): QuadraticVote[] {
    return this.votes.filter((vote) =>
      QuadraticVoting.isValidChoice(vote.choice, this.proposal.choices)
    );
  }

  getScores(): number[] {
    const results = this.proposal.choices
      .map((choice, i) =>
        this.getValidVotes()
          .map((vote) => quadraticMath(i, vote.choice, vote.balance))
          .reduce((a, b: any) => a + b, 0)
      )
      .map((sqrt) => sqrt * sqrt);

    return results
      .map((res, i) => percentageOfTotal(i, results, results))
      .map((p) => (this.getScoresTotal() / 100) * p);
  }

  getScoresByStrategy(): number[][] {
    const results = this.proposal.choices
      .map((choice, i) =>
        this.strategies.map((strategy, sI) =>
          this.getValidVotes()
            .map((vote) => quadraticMath(i, vote.choice, vote.scores[sI]))
            .reduce((a, b: any) => a + b, 0)
        )
      )
      .map((arr) => arr.map((sqrt) => [sqrt * sqrt]));

    return results.map((res, i) =>
      this.strategies
        .map((strategy, sI) =>
          percentageOfTotal(0, results[i][sI], results.flat(2))
        )
        .map((p) => [(this.getScoresTotal() / 100) * p])
        .flat()
    );
  }

  getScoresTotal(): number {
    return this.getValidVotes().reduce((a, b: any) => a + b.balance, 0);
  }

  getChoiceString(): string {
    return this.proposal.choices
      .map((choice, i) => {
        if (this.selected[i + 1]) {
          return `${
            Math.round(
              percentageOfTotal(
                i + 1,
                this.selected,
                Object.values(this.selected)
              ) * 10
            ) / 10
          }% for ${choice}`;
        }
      })
      .filter((el) => el != null)
      .join(', ');
  }
}
