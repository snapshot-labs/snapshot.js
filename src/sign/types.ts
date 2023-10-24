export interface Space {
  from?: string;
  space: string;
  timestamp?: number;
  settings: string;
}

export type ProposalType =
  | 'single-choice'
  | 'approval'
  | 'quadratic'
  | 'ranked-choice'
  | 'weighted'
  | 'basic';

export interface Proposal {
  from?: string;
  space: string;
  timestamp?: number;
  type: ProposalType;
  title: string;
  body: string;
  discussion: string;
  choices: string[];
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
  choices: string[];
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
  choice: number | number[] | string | { [key: string]: number };
  privacy?: string;
  reason?: string;
  app?: string;
  metadata?: string;
}

export interface Follow {
  from?: string;
  space: string;
  timestamp?: number;
}

export interface Unfollow {
  from?: string;
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

export const spaceTypes = {
  Space: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'settings', type: 'string' }
  ]
};

export const proposalTypes = {
  Proposal: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'type', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'body', type: 'string' },
    { name: 'discussion', type: 'string' },
    { name: 'choices', type: 'string[]' },
    { name: 'start', type: 'uint64' },
    { name: 'end', type: 'uint64' },
    { name: 'snapshot', type: 'uint64' },
    { name: 'plugins', type: 'string' },
    { name: 'app', type: 'string' }
  ]
};

export const updateProposalTypes = {
  UpdateProposal: [
    { name: 'proposal', type: 'string' },
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'type', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'body', type: 'string' },
    { name: 'discussion', type: 'string' },
    { name: 'choices', type: 'string[]' },
    { name: 'plugins', type: 'string' }
  ]
};

export const flagProposalTypes = {
  FlagProposal: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'proposal', type: 'string' },
    { name: 'timestamp', type: 'uint64' }
  ]
};

export const cancelProposalTypes = {
  CancelProposal: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'string' }
  ]
};

export const cancelProposal2Types = {
  CancelProposal: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'bytes32' }
  ]
};

export const voteTypes = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'string' },
    { name: 'choice', type: 'uint32' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

export const voteArrayTypes = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'string' },
    { name: 'choice', type: 'uint32[]' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

export const voteStringTypes = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'string' },
    { name: 'choice', type: 'string' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

export const vote2Types = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'bytes32' },
    { name: 'choice', type: 'uint32' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

export const voteArray2Types = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'bytes32' },
    { name: 'choice', type: 'uint32[]' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

export const voteString2Types = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'bytes32' },
    { name: 'choice', type: 'string' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

export const followTypes = {
  Follow: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' }
  ]
};

export const unfollowTypes = {
  Unfollow: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' }
  ]
};

export const subscribeTypes = {
  Subscribe: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' }
  ]
};

export const unsubscribeTypes = {
  Unsubscribe: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' }
  ]
};

export const profileTypes = {
  Profile: [
    { name: 'from', type: 'address' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'profile', type: 'string' }
  ]
};

export const statementTypes = {
  Statement: [
    { name: 'from', type: 'address' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'space', type: 'string' },
    { name: 'about', type: 'string' },
    { name: 'statement', type: 'string' }
  ]
};

export const aliasTypes = {
  Alias: [
    { name: 'from', type: 'address' },
    { name: 'alias', type: 'address' },
    { name: 'timestamp', type: 'uint64' }
  ]
};

export const deleteSpaceType = {
  DeleteSpace: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' }
  ]
};
