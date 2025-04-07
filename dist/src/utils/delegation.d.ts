export declare const SNAPSHOT_SUBGRAPH_URL: {
    "1": string;
    "10": string;
    "56": string;
    "100": string;
    "137": string;
    "146": string;
    "250": string;
    "5000": string;
    "8453": string;
    "42161": string;
    "59144": string;
    "81457": string;
    "84532": string;
    "11155111": string;
};
type Delegation = {
    delegator: string;
    delegate: string;
    space: string;
    timestamp: number;
};
export default function getDelegatesBySpace(network: string, space: string | null, snapshot?: string | number, options?: any): Promise<Delegation[]>;
export {};
