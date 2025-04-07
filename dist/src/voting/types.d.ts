export interface Strategy {
    name: string;
    network: string;
    params: Record<string, unknown>;
}
interface BaseVote<TChoice> {
    choice: TChoice;
    balance: number;
    scores: number[];
}
export type ChoiceMap = {
    [key: string]: number;
};
export type SingleChoiceVote = BaseVote<number>;
export type ApprovalVote = BaseVote<number[]>;
export type RankedChoiceVote = BaseVote<number[]>;
export type QuadraticVote = BaseVote<ChoiceMap>;
export type WeightedVote = BaseVote<ChoiceMap>;
export {};
