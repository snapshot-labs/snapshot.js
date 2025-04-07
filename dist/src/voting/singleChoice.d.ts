import { SingleChoiceVote, Strategy } from './types';
export default class SingleChoiceVoting {
    proposal: {
        choices: string[];
    };
    votes: SingleChoiceVote[];
    strategies: Strategy[];
    selected: number;
    constructor(proposal: {
        choices: string[];
    }, votes: SingleChoiceVote[], strategies: Strategy[], selected: number);
    static isValidChoice(voteChoice: number, proposalChoices: string[]): boolean;
    getValidVotes(): SingleChoiceVote[];
    getScores(): number[];
    getScoresByStrategy(): number[][];
    getScoresTotal(): number;
    getChoiceString(): string;
}
