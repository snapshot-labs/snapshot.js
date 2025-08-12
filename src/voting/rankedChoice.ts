import { getNumberWithOrdinal } from '../utils';
import { RankedChoiceVote, Strategy } from './types';

function irv(
  ballots: (number | number[])[][],
  rounds: {
    round: number;
    sortedByHighest: [string, [number, number[]]][];
  }[]
): { round: number; sortedByHighest: [string, [number, number[]]][] }[] {
  const candidates: number[] = [
    ...new Set(ballots.map((vote) => vote[0]).flat())
  ];
  const votes: [string, [number, number[]]][] = Object.entries(
    ballots.reduce((votes, [v], i, src) => {
      const balance = src[i][1];
      votes[v[0]][0] += balance;

      const score = src[i][2] as number[];
      if (score.length > 1) {
        votes[v[0]][1] = score.map((s, sI) => s + votes[v[0]][1][sI] || s);
      } else
        votes[v[0]][1] = [
          votes[v[0]][1].concat(score).reduce((a, b) => a + b, 0)
        ];
      return votes;
    }, Object.assign({}, ...candidates.map((c) => ({ [c]: [0, []] }))))
  );

  const votesWithoutScore = votes.map((vote) => [vote[0], vote[1][0]]);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [topCand, topCount]: number[] = votesWithoutScore.reduce(
    ([n, m]: any[], [v, c]: any[]) => (c > m ? [v, c] : [n, m]),
    ['?', -Infinity]
  );
  const [bottomCand, bottomCount] = votesWithoutScore.reduce(
    ([n, m], [v, c]) => (c < m ? [v, c] : [n, m]),
    ['?', Infinity]
  );
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const sortedByHighest = votes.sort((a, b) => b[1][0] - a[1][0]);

  const totalPowerOfVotes = ballots
    .map((bal) => bal[1])
    .reduce((a, b: any) => a + b, 0);

  rounds.push({
    round: rounds.length + 1,
    sortedByHighest
  });

  return topCount > (totalPowerOfVotes as number) / 2 ||
    sortedByHighest.length < 3
    ? rounds
    : irv(
        ballots
          .map((ballot) => [
            (ballot[0] as number[]).filter((c) => c != bottomCand),
            ballot[1],
            ballot[2]
          ])
          .filter((ballot) => (ballot[0] as number[]).length > 0),
        rounds
      );
}

/**
 * Runs the complete Instant Runoff Voting (IRV) algorithm and returns the final results.
 *
 * Executes all elimination rounds until a winner is determined or fewer than 3 candidates remain.
 * Each round eliminates the candidate with the fewest votes and redistributes their votes
 * to voters' next preferences.
 *
 * @param votes - Array of valid ranked choice votes to process
 * @returns Array of tuples representing the final candidate rankings, sorted by vote count (highest first).
 *          Each tuple contains [candidateIndex, [totalBalance, scoresArray]] where:
 *          - totalBalance: Sum of voting power from all voters who support this candidate
 *          - scoresArray: Breakdown of that voting power by voting strategy
 *          The relationship: totalBalance === scoresArray.reduce((a,b) => a + b, 0)
 *
 * @example
 * // Returns final results after IRV elimination rounds
 * // [["2", [150, [60,50,40]]], ["1", [120, [70,30,20]]], ...]
 * // Candidate 2 wins with 150 total voting power (60+50+40 from 3 strategies)
 * // Candidate 1 has 120 total voting power (70+30+20 from 3 strategies)
 */
export function getFinalRound(
  votes: RankedChoiceVote[]
): [string, [number, number[]]][] {
  const rounds = irv(
    votes.map((vote) => [vote.choice, vote.balance, vote.scores]),
    []
  );
  const finalRound = rounds[rounds.length - 1];
  return finalRound.sortedByHighest;
}

/**
 * Converts IRV final results into a simple array of scores indexed by proposal choice order.
 *
 * Takes the ranked results from getFinalRound() (sorted by winner) and transforms them
 * into an array where each position corresponds to the original proposal choice index.
 * This allows easy lookup of any candidate's final vote total by their position in the proposal.
 *
 * @param votes - Array of valid ranked choice votes to process
 * @param proposal - Proposal object containing the choices array
 * @returns Array of total voting power for each choice, indexed by proposal order.
 *          Position 0 = first choice's votes, position 1 = second choice's votes, etc.
 *
 * @example
 * // proposal.choices = ['Alice', 'Bob', 'Carol', 'David']
 * // After IRV: Bob won (150), David 2nd (120), Alice 3rd (100), Carol 4th (80)
 * // Returns: [100, 150, 80, 120]
 * //           ↑    ↑    ↑   ↑
 * //        Alice Bob Carol David (proposal order)
 */
function getFinalScoresByChoice(
  votes: RankedChoiceVote[],
  proposal: { choices: string[] }
) {
  const finalRound = getFinalRound(votes);
  return proposal.choices.map((choice, i) =>
    finalRound
      .filter((res) => Number(res[0]) === i + 1)
      .reduce((a, b) => a + b[1][0], 0)
  );
}

export default class RankedChoiceVoting {
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

  static isValidChoice(
    voteChoice: number[],
    proposalChoices: string[]
  ): boolean {
    return (
      Array.isArray(voteChoice) &&
      // If voteChoice index is not in choices, return false
      voteChoice.every(
        (voteChoice) => proposalChoices?.[voteChoice - 1] !== undefined
      ) &&
      // If any voteChoice is duplicated, return false
      voteChoice.length === new Set(voteChoice).size &&
      // If voteChoice is empty, return false
      voteChoice.length > 0 &&
      // If not all proposalChoices are selected, return false
      // TODO: We should add support for pacial bailout in the future
      voteChoice.length === proposalChoices.length
    );
  }

  getValidVotes(): RankedChoiceVote[] {
    return this.votes.filter((vote) =>
      RankedChoiceVoting.isValidChoice(vote.choice, this.proposal.choices)
    );
  }

  getScores(): number[] {
    return getFinalScoresByChoice(this.getValidVotes(), this.proposal);
  }

  getScoresByStrategy(): number[][] {
    const finalRound = getFinalRound(this.getValidVotes());
    return this.proposal.choices.map((choice, i) =>
      this.strategies.map((strategy, sI) => {
        return finalRound
          .filter((res) => Number(res[0]) === i + 1)
          .reduce((a, b) => a + (b[1][1][sI] || 0), 0);
      })
    );
  }

  /**
   * Returns the total voting power from all submitted votes, including invalid ones.
   *
   * This method sums the balance (voting power) from ALL votes submitted to the proposal,
   * regardless of whether they have valid choice arrays. This is useful for calculating
   * total participation, quorum requirements, and percentage of total voting power.
   *
   * Note: This differs from IRV final results which only include valid votes. Invalid votes
   * are excluded from IRV calculations but their voting power is still counted here for
   * participation metrics.
   *
   * @returns Total voting power from all votes (valid + invalid)
   *
   * @example
   * // votes = [
   * //   { choice: [1,2,3,4], balance: 1000 }, // Valid
   * //   { choice: [1,5,2], balance: 500 },    // Invalid (index 5)
   * //   { choice: [2,1,4,3], balance: 750 }   // Valid
   * // ]
   * // Returns: 2250 (includes invalid vote's 500 balance)
   */
  getScoresTotal(): number {
    return this.votes.reduce((a, b: any) => a + b.balance, 0);
  }

  /**
   * Converts the selected choice indices into a human-readable string representation.
   *
   * Note: This method supports partial ranking where not all available choices
   * need to be selected. The ordinal positions (1st, 2nd, etc.) reflect the
   * order of valid selections only. Invalid choice indices are filtered out.
   *
   * @returns A formatted string showing the ranked choices with ordinal positions.
   * Only valid choices are included, invalid indices are silently ignored.
   *
   * @example
   * // With choices ['Alice', 'Bob', 'Carol', 'David'] and selected [1, 3, 2]
   * // Returns: "(1st) Alice, (2nd) Carol, (3rd) Bob"
   *
   * @example
   * // Partial ranking with choices ['Alice', 'Bob', 'Carol', 'David'] and selected [4, 1]
   * // Returns: "(1st) David, (2nd) Alice"
   *
   * @example
   * // With invalid choice index 5 in selected [1, 5]
   * // Returns: "(1st) Alice" - invalid choice 5 is filtered out
   */
  getChoiceString(): string {
    return this.selected
      .map((choice) => this.proposal.choices[choice - 1])
      .filter(Boolean)
      .map((el, i) => `(${getNumberWithOrdinal(i + 1)}) ${el}`)
      .join(', ');
  }
}
