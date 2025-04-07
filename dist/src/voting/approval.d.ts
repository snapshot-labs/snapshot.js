import { ApprovalVote, Strategy } from './types';
export default class ApprovalVoting {
    proposal: {
        choices: string[];
    };
    votes: ApprovalVote[];
    strategies: Strategy[];
    selected: number[];
    constructor(proposal: {
        choices: string[];
    }, votes: ApprovalVote[], strategies: Strategy[], selected: number[]);
    static isValidChoice(voteChoice: number[], proposalChoices: string[]): boolean;
    getValidVotes(): {
        choice: number[];
        balance: number;
        scores: number[];
    }[];
    getScores(): number[];
    getScoresByStrategy(): number[][];
    getScoresTotal(): number;
    getChoiceString(): string;
}
