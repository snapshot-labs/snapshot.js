function filterVotesWithInvalidChoice(votes, choices) {
  return votes.filter((vote) => {
    return (
      Array.isArray(vote.choice) &&
      // If choice index is not in choices, return false
      vote.choice.every((choice) => choices?.[choice - 1] !== undefined) &&
      // If any choice is duplicated, return false
      vote.choice.length === new Set(vote.choice).size
    );
  });
}

export default class ApprovalVoting {
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

  getValidatedVotes() {
    return filterVotesWithInvalidChoice(this.votes, this.proposal.choices);
  }

  getScores() {
    return this.proposal.choices.map((choice, i) =>
      this.getValidatedVotes()
        .filter((vote) => vote.choice.includes(i + 1))
        .reduce((a, b) => a + b.balance, 0)
    );
  }

  getScoresByStrategy() {
    return this.proposal.choices.map((choice, i) =>
      this.strategies.map((strategy, sI) =>
        this.getValidatedVotes()
          .filter((vote) => vote.choice.includes(i + 1))
          .reduce((a, b) => a + b.scores[sI], 0)
      )
    );
  }

  getScoresTotal() {
    return this.getValidatedVotes().reduce((a, b) => a + b.balance, 0);
  }

  getChoiceString() {
    if (!this.selected) return '';
    return this.proposal.choices
      .filter((choice, i) => this.selected.includes(i + 1))
      .join(', ');
  }
}
