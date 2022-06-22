import { WeightedVote, Strategy } from './types';

export function isChoiceValid(vote: WeightedVote, choices: string[]): boolean {
  return (
    typeof vote.choice === 'object' &&
    !Array.isArray(vote.choice) &&
    vote.choice !== null &&
    // If choice object keys are not in choices, return false
    Object.keys(vote.choice).every(
      (key) => choices?.[Number(key) - 1] !== undefined
    ) &&
    // If choice object is empty, return false
    Object.keys(vote.choice).length > 0 &&
    // If choice object values are not a positive integer, return false
    Object.values(vote.choice).every(
      (value) => typeof value === 'number' && value > 0
    )
  );
}

export function percentageOfTotal(i, values, total): number {
  const reducedTotal: any = total.reduce((a: any, b: any) => a + b, 0);
  const percent = (values[i] / reducedTotal) * 100;
  return isNaN(percent) ? 0 : percent;
}

export function weightedPower(i, choice, balance): number {
  return (
    (percentageOfTotal(i + 1, choice, Object.values(choice)) / 100) * balance
  );
}

export default class WeightedVoting {
  proposal: { choices: string[] };
  votes: WeightedVote[];
  strategies: Strategy[];
  selected: { [key: string]: number };

  constructor(
    proposal: { choices: string[] },
    votes: WeightedVote[],
    strategies: Strategy[],
    selected: { [key: string]: number }
  ) {
    this.proposal = proposal;
    this.votes = votes;
    this.strategies = strategies;
    this.selected = selected;
  }

  getValidatedVotes(): WeightedVote[] {
    return this.votes.filter((vote) =>
      isChoiceValid(vote, this.proposal.choices)
    );
  }

  getScores(): number[] {
    const results = this.proposal.choices.map((choice, i) =>
      this.getValidatedVotes()
        .map((vote) => weightedPower(i, vote.choice, vote.balance))
        .reduce((a, b: any) => a + b, 0)
    );

    return results
      .map((res, i) => percentageOfTotal(i, results, results))
      .map((p) => (this.getScoresTotal() / 100) * p);
  }

  getScoresByStrategy(): number[][] {
    const results = this.proposal.choices
      .map((choice, i) =>
        this.strategies.map((strategy, sI) =>
          this.getValidatedVotes()
            .map((vote) => weightedPower(i, vote.choice, vote.scores[sI]))
            .reduce((a, b: any) => a + b, 0)
        )
      )
      .map((arr) => arr.map((pwr) => [pwr]));

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
    return this.getValidatedVotes().reduce((a, b: any) => a + b.balance, 0);
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
