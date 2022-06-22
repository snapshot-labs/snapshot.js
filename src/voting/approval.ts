import { ApprovalVote, Strategy } from './types';

export function isChoiceValid(choice: number[], choices: string[]): boolean {
  return (
    Array.isArray(choice) &&
    // If choice index is not in choices, return false
    choice.every((choice) => choices?.[choice - 1] !== undefined) &&
    // If any choice is duplicated, return false
    choice.length === new Set(choice).size
  );
}

export default class ApprovalVoting {
  proposal: { choices: string[] };
  votes: ApprovalVote[];
  strategies: Strategy[];
  selected: number[];

  constructor(
    proposal: { choices: string[] },
    votes: ApprovalVote[],
    strategies: Strategy[],
    selected: number[]
  ) {
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
    return this.votes.filter((vote) =>
      isChoiceValid(vote.choice, this.proposal.choices)
    );
  }

  getScores(): number[] {
    return this.proposal.choices.map((choice, i) =>
      this.getValidatedVotes()
        .filter((vote) => vote.choice.includes(i + 1))
        .reduce((a, b) => a + b.balance, 0)
    );
  }

  getScoresByStrategy(): number[][] {
    return this.proposal.choices.map((choice, i) =>
      this.strategies.map((strategy, sI) =>
        this.getValidatedVotes()
          .filter((vote) => vote.choice.includes(i + 1))
          .reduce((a, b) => a + b.scores[sI], 0)
      )
    );
  }

  getScoresTotal(): number {
    return this.getValidatedVotes().reduce((a, b) => a + b.balance, 0);
  }

  getChoiceString(): string {
    if (!this.selected) return '';
    return this.proposal.choices
      .filter((choice, i) => this.selected.includes(i + 1))
      .join(', ');
  }
}
