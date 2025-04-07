import { WeightedVote, Strategy } from './types';
export declare function percentageOfTotal(i: any, values: any, total: any): number;
export declare function weightedPower(i: any, choice: any, balance: any): number;
export default class WeightedVoting {
    proposal: {
        choices: string[];
    };
    votes: WeightedVote[];
    strategies: Strategy[];
    selected: {
        [key: string]: number;
    };
    constructor(proposal: {
        choices: string[];
    }, votes: WeightedVote[], strategies: Strategy[], selected: {
        [key: string]: number;
    });
    static isValidChoice(voteChoice: {
        [key: string]: number;
    }, proposalChoices: string[]): boolean;
    getValidVotes(): WeightedVote[];
    getScores(): number[];
    getScoresByStrategy(): number[][];
    getScoresTotal(): number;
    getChoiceString(): string;
}
