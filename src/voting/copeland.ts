import { Strategy, RankedChoiceVote } from './types';

// CopelandVoting implements ranked choice voting using Copeland's method
// This method compares each pair of choices and awards points based on pairwise victories
export default class CopelandVoting {
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

  // Validates if a vote choice is valid for the given proposal
  // Allows partial ranking (not all choices need to be ranked)
  static isValidChoice(
    voteChoice: number[],
    proposalChoices: string[]
  ): boolean {
    if (
      !Array.isArray(voteChoice) ||
      voteChoice.length === 0 ||
      voteChoice.length > proposalChoices.length ||
      new Set(voteChoice).size !== voteChoice.length
    ) {
      return false;
    }

    return voteChoice.every(
      (choice) =>
        Number.isInteger(choice) &&
        choice >= 1 &&
        choice <= proposalChoices.length
    );
  }

  // Returns only the valid votes
  getValidVotes(): RankedChoiceVote[] {
    return this.votes.filter((vote) =>
      CopelandVoting.isValidChoice(vote.choice, this.proposal.choices)
    );
  }

  // Calculates the Copeland scores for each choice
  getScores(): number[] {
    const validVotes = this.getValidVotes();
    const choicesCount = this.proposal.choices.length;
    const pairwiseComparisons = Array.from({ length: choicesCount }, () =>
      Array(choicesCount).fill(0)
    );

    // Calculate pairwise comparisons
    for (const vote of validVotes) {
      for (let i = 0; i < vote.choice.length; i++) {
        for (let j = i + 1; j < vote.choice.length; j++) {
          const winner = vote.choice[i] - 1;
          const loser = vote.choice[j] - 1;
          pairwiseComparisons[winner][loser] += vote.balance;
          pairwiseComparisons[loser][winner] -= vote.balance;
        }
      }
    }

    // Calculate Copeland scores
    const scores = Array(choicesCount).fill(0);
    for (let i = 0; i < choicesCount; i++) {
      for (let j = 0; j < choicesCount; j++) {
        if (i !== j) {
          if (pairwiseComparisons[i][j] > 0) {
            scores[i]++;
          } else if (pairwiseComparisons[i][j] < 0) {
            scores[j]++;
          } else {
            scores[i] += 0.5;
            scores[j] += 0.5;
          }
        }
      }
    }

    return scores;
  }

  // Calculates the Copeland scores for each choice, broken down by strategy
  getScoresByStrategy(): number[][] {
    const validVotes = this.getValidVotes();
    const choicesCount = this.proposal.choices.length;
    const strategiesCount = this.strategies.length;
    const pairwiseComparisons = Array.from({ length: choicesCount }, () =>
      Array.from({ length: choicesCount }, () => Array(strategiesCount).fill(0))
    );

    // Calculate pairwise comparisons for each strategy
    for (const vote of validVotes) {
      for (let i = 0; i < vote.choice.length; i++) {
        for (let j = i + 1; j < vote.choice.length; j++) {
          const winner = vote.choice[i] - 1;
          const loser = vote.choice[j] - 1;
          for (let s = 0; s < strategiesCount; s++) {
            pairwiseComparisons[winner][loser][s] += vote.scores[s];
            pairwiseComparisons[loser][winner][s] -= vote.scores[s];
          }
        }
      }
    }

    // Calculate Copeland scores for each strategy
    const scores = Array.from({ length: choicesCount }, () =>
      Array(strategiesCount).fill(0)
    );

    for (let i = 0; i < choicesCount; i++) {
      for (let j = 0; j < choicesCount; j++) {
        if (i !== j) {
          for (let s = 0; s < strategiesCount; s++) {
            if (pairwiseComparisons[i][j][s] > 0) {
              scores[i][s]++;
            } else if (pairwiseComparisons[i][j][s] < 0) {
              scores[j][s]++;
            } else {
              scores[i][s] += 0.5;
              scores[j][s] += 0.5;
            }
          }
        }
      }
    }

    return scores;
  }

  // Calculates the total score (sum of all valid vote balances)
  getScoresTotal(): number {
    return this.getValidVotes().reduce(
      (total, vote) => total + vote.balance,
      0
    );
  }

  // Returns a string representation of the selected choices
  getChoiceString(): string {
    return this.selected
      .map((choice) => this.proposal.choices[choice - 1])
      .join(', ');
  }
}
