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

  getProposalResults(): number[] {
    return this.proposal.choices.map((choice, i) => {
      const votes = this.votes.filter((vote) => vote.choice === i + 1);
      const balanceSum = votes.reduce((a, b) => a + b.balance, 0);
      return balanceSum;
    });
  }

  getProposalResultsByStrategy(): number[][] {
    return this.proposal.choices.map((choice, i) => {
      const scores = this.strategies.map((strategy, sI) => {
        const votes = this.votes.filter((vote) => vote.choice === i + 1);
        const scoreSum = votes.reduce((a, b) => a + b.scores[sI], 0);
        return scoreSum;
      });
      return scores;
    });
  }

  getProposalResultsSum(): number {
    return this.votes.reduce((a, b) => a + b.balance, 0);
  }

  getChoiceString(): string {
    console.log(this.selected);
    return this.proposal.choices[this.selected - 1];
  }
}
