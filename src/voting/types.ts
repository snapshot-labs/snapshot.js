export interface Strategy {
  name: string;
  network: string;
  params: Record<string, unknown>;
}

export interface SingleChoiceVote {
  choice: number;
  balance: number;
  scores: number[];
}

export interface ApprovalVote {
  choice: number[];
  balance: number;
  scores: number[];
}

export interface RankedChoiceVote {
  choice: number[];
  balance: number;
  scores: number[];
}

export interface QuadraticVote {
  choice: { [key: string]: number };
  balance: number;
  scores: number[];
}

export interface WeightedVote {
  choice: { [key: string]: number };
  balance: number;
  scores: number[];
}
