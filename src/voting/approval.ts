import { ApprovalVote, Strategy } from './types';

export function isValidChoice(
  voteChoice: number[],
  proposalChoices: string[]
): boolean {
  return (
    Array.isArray(voteChoice) &&
    // If choice index is not in choices, return false
    voteChoice.every((choice) => proposalChoices?.[choice - 1] !== undefined) &&
    // If any choice is duplicated, return false
    voteChoice.length === new Set(voteChoice).size
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

  getValidVotes(): {
    choice: number[];
    balance: number;
    scores: number[];
  }[] {
    return this.votes.filter((vote) =>
      isValidChoice(vote.choice, this.proposal.choices)
    );
  }

  getScores(): number[] {
    return this.proposal.choices.map((choice, i) =>
      this.getValidVotes()
        .filter((vote) => vote.choice.includes(i + 1))
        .reduce((a, b) => a + b.balance, 0)
    );
  }

  getScoresByStrategy(): number[][] {
    return this.proposal.choices.map((choice, i) =>
      this.strategies.map((strategy, sI) =>
        this.getValidVotes()
          .filter((vote) => vote.choice.includes(i + 1))
          .reduce((a, b) => a + b.scores[sI], 0)
      )
    );
  }

  getScoresTotal(): number {
    return this.getValidVotes().reduce((a, b) => a + b.balance, 0);
  }

  getChoiceString(): string {
    if (!this.selected) return '';
    return this.proposal.choices
      .filter((choice, i) => this.selected.includes(i + 1))
      .join(', ');
  }
}
