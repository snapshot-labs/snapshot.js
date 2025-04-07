import { Strategy, RankedChoiceVote } from './types';
export default class CopelandVoting {
    proposal: {
        choices: string[];
    };
    votes: RankedChoiceVote[];
    strategies: Strategy[];
    selected: number[];
    constructor(proposal: {
        choices: string[];
    }, votes: RankedChoiceVote[], strategies: Strategy[], selected: number[]);
    static isValidChoice(voteChoice: number[], proposalChoices: string[]): boolean;
    getValidVotes(): RankedChoiceVote[];
    getScores(): number[];
    getScoresByStrategy(): number[][];
    getScoresTotal(): number;
    getChoiceString(): string;
}
