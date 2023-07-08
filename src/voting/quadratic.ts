import { QuadraticVote, QuadraticChoice, Strategy } from './types';

export function calcPercentageOfSum(
  part: number,
  wholeArray: number[]
): number {
  const whole = wholeArray.reduce((a, b) => a + b, 0);
  const percent = part / whole;
  return isNaN(percent) ? 0 : percent;
}

export function calcSqrt(
  percentageWeight: number,
  votingPower: number
): number {
  return Math.sqrt(percentageWeight * votingPower);
}

function calcSquare(num: number): number {
  return num * num;
}

function calcReducedQuadraticScores(
  percentages: number[],
  scoresTotal: number
): number[] {
  // Reduce each quadratic score so that the sum of quadratic scores matches
  // the total scores.
  // This is done to unsure that features like quorum still work as expected.
  return percentages.map((p) => scoresTotal * p);
}

export default class QuadraticVoting {
  proposal: { choices: string[] };
  votes: QuadraticVote[];
  strategies: Strategy[];
  selected: QuadraticChoice;

  constructor(
    proposal: { choices: string[] },
    votes: QuadraticVote[],
    strategies: Strategy[],
    selected: QuadraticChoice
  ) {
    this.proposal = proposal;
    this.votes = votes;
    this.strategies = strategies;
    this.selected = selected;
  }

  static isValidChoice(
    voteChoice: QuadraticChoice,
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
    const validVotes = this.getValidVotes();
    const scoresTotal = this.getValidVotes().reduce(
      (a, b: any) => a + b.balance,
      0
    );

    const quadraticScores = this.proposal.choices.map((_, i) => {
      const votingPowerSqrt = validVotes
        .map((vote) => {
          const choiceWeightPercent = calcPercentageOfSum(
            vote.choice[i + 1],
            Object.values(vote.choice)
          );
          return calcSqrt(choiceWeightPercent, vote.balance);
        })
        .reduce((a, b: any) => a + b, 0);
      return calcSquare(votingPowerSqrt);
    });

    const percentagesOfScores = quadraticScores.map((_, i) =>
      calcPercentageOfSum(quadraticScores[i], quadraticScores)
    );

    return calcReducedQuadraticScores(percentagesOfScores, scoresTotal);
  }

  getScoresByStrategy(): number[][] {
    const validVotes = this.getValidVotes();
    const scoresTotal = this.getValidVotes().reduce(
      (a, b: any) => a + b.balance,
      0
    );

    const quadraticScoresByStrategy = this.proposal.choices
      .map((_, i) =>
        this.strategies.map((_, sI) =>
          validVotes
            .map((vote) => {
              const choiceWeightPercentByStrategy = calcPercentageOfSum(
                vote.choice[i + 1],
                Object.values(vote.choice)
              );
              return calcSqrt(choiceWeightPercentByStrategy, vote.scores[sI]);
            })
            .reduce((a, b: any) => a + b, 0)
        )
      )
      .map((arr) => arr.map((num) => [calcSquare(num)]));

    const reducedQuadraticScores = quadraticScoresByStrategy.map((_, i) => {
      const percentagesOfScores = this.strategies.map((_, sI) =>
        calcPercentageOfSum(
          quadraticScoresByStrategy[i][sI][0],
          quadraticScoresByStrategy.flat(2)
        )
      );

      return calcReducedQuadraticScores(percentagesOfScores, scoresTotal);
    });

    return reducedQuadraticScores;
  }

  getScoresTotal(): number {
    return this.votes.reduce((a, b: any) => a + b.balance, 0);
  }

  getChoiceString(): string {
    return this.proposal.choices
      .map((choice, i) => {
        if (this.selected[i + 1]) {
          const percent = calcPercentageOfSum(
            this.selected[i + 1],
            Object.values(this.selected)
          );
          return `${Math.round(percent * 1000) / 10}% for ${choice}`;
        }
      })
      .filter((el) => el != null)
      .join(', ');
  }
}
