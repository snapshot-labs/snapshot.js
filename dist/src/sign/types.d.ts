export interface Space {
    from?: string;
    space: string;
    timestamp?: number;
    settings: string;
}
export type ProposalType = 'single-choice' | 'approval' | 'quadratic' | 'ranked-choice' | 'weighted' | 'basic';
export interface Proposal {
    from?: string;
    space: string;
    timestamp?: number;
    type: ProposalType;
    title: string;
    body: string;
    discussion: string;
    privacy?: string;
    choices: string[];
    labels?: string[];
    start: number;
    end: number;
    snapshot: number;
    plugins: string;
    app?: string;
}
export interface UpdateProposal {
    proposal: string;
    from?: string;
    space: string;
    timestamp?: number;
    type: ProposalType;
    title: string;
    body: string;
    discussion: string;
    privacy?: string;
    choices: string[];
    labels?: string[];
    plugins: string;
}
export interface FlagProposal {
    from?: string;
    space: string;
    proposal: string;
    timestamp?: number;
}
export interface CancelProposal {
    from?: string;
    space: string;
    timestamp?: number;
    proposal: string;
}
export interface Vote {
    from?: string;
    space: string;
    timestamp?: number;
    proposal: string;
    type: ProposalType;
    choice: number | number[] | string | {
        [key: string]: number;
    };
    privacy?: string;
    reason?: string;
    app?: string;
    metadata?: string;
}
export interface Follow {
    from?: string;
    network?: string;
    space: string;
    timestamp?: number;
}
export interface Unfollow {
    from?: string;
    network?: string;
    space: string;
    timestamp?: number;
}
export interface Subscribe {
    from?: string;
    space: string;
    timestamp?: number;
}
export interface Unsubscribe {
    from?: string;
    space: string;
    timestamp?: number;
}
export interface Profile {
    from?: string;
    timestamp?: number;
    profile: string;
}
export interface Statement {
    from?: string;
    timestamp?: number;
    space: string;
    about: string;
    statement: string;
    discourse?: string;
    status?: string;
    network?: string;
}
export interface Alias {
    from?: string;
    alias: string;
    timestamp?: number;
}
export interface DeleteSpace {
    from?: string;
    space: string;
    timestamp?: number;
}
export declare const spaceTypes: {
    Space: {
        name: string;
        type: string;
    }[];
};
export declare const proposalTypes: {
    Proposal: {
        name: string;
        type: string;
    }[];
};
export declare const updateProposalTypes: {
    UpdateProposal: {
        name: string;
        type: string;
    }[];
};
export declare const flagProposalTypes: {
    FlagProposal: {
        name: string;
        type: string;
    }[];
};
export declare const cancelProposalTypes: {
    CancelProposal: {
        name: string;
        type: string;
    }[];
};
export declare const cancelProposal2Types: {
    CancelProposal: {
        name: string;
        type: string;
    }[];
};
export declare const voteTypes: {
    Vote: {
        name: string;
        type: string;
    }[];
};
export declare const voteArrayTypes: {
    Vote: {
        name: string;
        type: string;
    }[];
};
export declare const voteStringTypes: {
    Vote: {
        name: string;
        type: string;
    }[];
};
export declare const vote2Types: {
    Vote: {
        name: string;
        type: string;
    }[];
};
export declare const voteArray2Types: {
    Vote: {
        name: string;
        type: string;
    }[];
};
export declare const voteString2Types: {
    Vote: {
        name: string;
        type: string;
    }[];
};
export declare const followTypes: {
    Follow: {
        name: string;
        type: string;
    }[];
};
export declare const unfollowTypes: {
    Unfollow: {
        name: string;
        type: string;
    }[];
};
export declare const subscribeTypes: {
    Subscribe: {
        name: string;
        type: string;
    }[];
};
export declare const unsubscribeTypes: {
    Unsubscribe: {
        name: string;
        type: string;
    }[];
};
export declare const profileTypes: {
    Profile: {
        name: string;
        type: string;
    }[];
};
export declare const statementTypes: {
    Statement: {
        name: string;
        type: string;
    }[];
};
export declare const aliasTypes: {
    Alias: {
        name: string;
        type: string;
    }[];
};
export declare const deleteSpaceType: {
    DeleteSpace: {
        name: string;
        type: string;
    }[];
};
