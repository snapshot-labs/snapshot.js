function filterVotesWithInvalidChoice(votes, choices) {
  return votes.filter((vote) => {
    return (
      typeof vote.choice === 'number' &&
      choices?.[vote.choice - 1] !== undefined
    );
  });
}

export default class SingleChoiceVoting {
  proposal: { choices: string[] };
  votes: { choice: number; balance: number; scores: number[] }[];
  strategies: {
    name: string;
    network: string;
    params: Record<string, unknown>;
  }[];
  selected: number;

  constructor(proposal, votes, strategies, selected) {
    this.proposal = proposal;
    this.votes = votes;
    this.strategies = strategies;
    this.selected = selected;
  }

  getValidatedVotes(): { choice: number; balance: number; scores: number[] }[] {
    return filterVotesWithInvalidChoice(this.votes, this.proposal.choices);
  }

  getScores(): number[] {
    return this.proposal.choices.map((choice, i) => {
      const votes = this.getValidatedVotes().filter(
        (vote) => vote.choice === i + 1
      );
      const balanceSum = votes.reduce((a, b) => a + b.balance, 0);
      return balanceSum;
    });
  }

  getScoresByStrategy(): number[][] {
    return this.proposal.choices.map((choice, i) => {
      const scores = this.strategies.map((strategy, sI) => {
        const votes = this.getValidatedVotes().filter(
          (vote) => vote.choice === i + 1
        );
        const scoreSum = votes.reduce((a, b) => a + b.scores[sI], 0);
        return scoreSum;
      });
      return scores;
    });
  }

  getScoresTotal(): number {
    return this.getValidatedVotes().reduce((a, b) => a + b.balance, 0);
  }

  getChoiceString(): string {
    return this.proposal.choices[this.selected - 1];
  }
}
