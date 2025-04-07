import { QuadraticVote, ChoiceMap, Strategy } from './types';
export declare function calcPercentageOfSum(part: number, wholeArray: number[]): number;
export declare function calcSqrt(percentageWeight: number, votingPower: number): number;
export default class QuadraticVoting {
    proposal: {
        choices: string[];
    };
    votes: QuadraticVote[];
    strategies: Strategy[];
    selected: ChoiceMap;
    constructor(proposal: {
        choices: string[];
    }, votes: QuadraticVote[], strategies: Strategy[], selected: ChoiceMap);
    static isValidChoice(voteChoice: ChoiceMap, proposalChoices: string[]): boolean;
    getValidVotes(): QuadraticVote[];
    getScores(): number[];
    getScoresByStrategy(): number[][];
    getScoresTotal(): number;
    getChoiceString(): string;
}
