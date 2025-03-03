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
    const totalVotingPower = this.getScoresTotal();

    // Calculate pairwise comparisons
    for (const vote of validVotes) {
      for (
        let currentRank = 0;
        currentRank < vote.choice.length;
        currentRank++
      ) {
        for (
          let nextRank = currentRank + 1;
          nextRank < vote.choice.length;
          nextRank++
        ) {
          const preferredChoice = vote.choice[currentRank] - 1;
          const lowerChoice = vote.choice[nextRank] - 1;
          pairwiseComparisons[preferredChoice][lowerChoice] += vote.balance;
          pairwiseComparisons[lowerChoice][preferredChoice] -= vote.balance;
        }
      }
    }

    // Calculate Copeland scores
    const scores = Array(choicesCount).fill(0);
    let totalCopelandScore = 0;

    for (let choiceIndex = 0; choiceIndex < choicesCount; choiceIndex++) {
      for (
        let opponentIndex = 0;
        opponentIndex < choicesCount;
        opponentIndex++
      ) {
        if (choiceIndex !== opponentIndex) {
          const comparison = pairwiseComparisons[choiceIndex][opponentIndex];
          if (comparison > 0) {
            scores[choiceIndex]++;
          } else if (comparison < 0) {
            scores[opponentIndex]++;
          } else {
            scores[choiceIndex] += 0.5;
            scores[opponentIndex] += 0.5;
          }
        }
      }
    }

    // Calculate total Copeland score for normalization
    totalCopelandScore = scores.reduce((sum, score) => sum + score, 0);

    // Normalize scores to distribute voting power
    if (totalCopelandScore > 0) {
      return scores.map(
        (score) => (score / totalCopelandScore) * totalVotingPower
      );
    }

    // If no clear winners, distribute power equally
    return scores.map(() => totalVotingPower / choicesCount);
  }

  // Calculates the Copeland scores for each choice, broken down by strategy
  getScoresByStrategy(): number[][] {
    const validVotes = this.getValidVotes();
    const choicesCount = this.proposal.choices.length;
    const strategiesCount = this.strategies.length;
    const pairwiseComparisons = Array.from({ length: choicesCount }, () =>
      Array.from({ length: choicesCount }, () => Array(strategiesCount).fill(0))
    );

    // Calculate total voting power per strategy
    const strategyTotals = Array(strategiesCount).fill(0);
    for (const vote of validVotes) {
      for (let i = 0; i < strategiesCount; i++) {
        strategyTotals[i] += vote.scores[i];
      }
    }

    // Calculate pairwise comparisons for each strategy
    for (const vote of validVotes) {
      for (
        let currentRank = 0;
        currentRank < vote.choice.length;
        currentRank++
      ) {
        for (
          let nextRank = currentRank + 1;
          nextRank < vote.choice.length;
          nextRank++
        ) {
          const preferredChoice = vote.choice[currentRank] - 1;
          const lowerChoice = vote.choice[nextRank] - 1;
          for (
            let strategyIndex = 0;
            strategyIndex < strategiesCount;
            strategyIndex++
          ) {
            pairwiseComparisons[preferredChoice][lowerChoice][strategyIndex] +=
              vote.scores[strategyIndex];
            pairwiseComparisons[lowerChoice][preferredChoice][strategyIndex] -=
              vote.scores[strategyIndex];
          }
        }
      }
    }

    // Calculate Copeland scores for each strategy
    const scores = Array.from({ length: choicesCount }, () =>
      Array(strategiesCount).fill(0)
    );

    for (let choiceIndex = 0; choiceIndex < choicesCount; choiceIndex++) {
      for (
        let opponentIndex = 0;
        opponentIndex < choicesCount;
        opponentIndex++
      ) {
        if (choiceIndex !== opponentIndex) {
          for (
            let strategyIndex = 0;
            strategyIndex < strategiesCount;
            strategyIndex++
          ) {
            const comparison =
              pairwiseComparisons[choiceIndex][opponentIndex][strategyIndex];
            if (comparison > 0) {
              scores[choiceIndex][strategyIndex]++;
            } else if (comparison < 0) {
              scores[opponentIndex][strategyIndex]++;
            } else {
              scores[choiceIndex][strategyIndex] += 0.5;
              scores[opponentIndex][strategyIndex] += 0.5;
            }
          }
        }
      }
    }

    // Normalize scores by strategy to distribute voting power
    const normalizedScores = Array.from({ length: choicesCount }, () =>
      Array(strategiesCount).fill(0)
    );

    for (
      let strategyIndex = 0;
      strategyIndex < strategiesCount;
      strategyIndex++
    ) {
      // Calculate total Copeland score for this strategy
      let totalCopelandScore = 0;
      for (let choiceIndex = 0; choiceIndex < choicesCount; choiceIndex++) {
        totalCopelandScore += scores[choiceIndex][strategyIndex];
      }

      // Normalize scores to distribute voting power for this strategy
      if (totalCopelandScore > 0) {
        for (let choiceIndex = 0; choiceIndex < choicesCount; choiceIndex++) {
          normalizedScores[choiceIndex][strategyIndex] =
            (scores[choiceIndex][strategyIndex] / totalCopelandScore) *
            strategyTotals[strategyIndex];
        }
      } else if (strategyTotals[strategyIndex] > 0) {
        // If no clear winners, distribute power equally for this strategy
        for (let choiceIndex = 0; choiceIndex < choicesCount; choiceIndex++) {
          normalizedScores[choiceIndex][strategyIndex] =
            strategyTotals[strategyIndex] / choicesCount;
        }
      }
    }

    return normalizedScores;
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
