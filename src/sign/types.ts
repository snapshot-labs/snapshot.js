export interface Space {
  from?: string;
  space: string;
  timestamp?: number;
  settings: string;
}

export interface Proposal {
  from?: string;
  space: string;
  timestamp?: number;
  type: string;
  title: string;
  body: string;
  discussion: string;
  choices: string[];
  start: number;
  end: number;
  snapshot: number;
  network: string;
  strategies: string;
  plugins: string;
  metadata: string;
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
  type: string;
  choice: number | number[] | string;
  metadata: string;
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
export interface Alias {
  from?: string;
  alias: string;
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
    { name: 'network', type: 'string' },
    { name: 'strategies', type: 'string' },
    { name: 'plugins', type: 'string' },
    { name: 'metadata', type: 'string' }
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
    { name: 'metadata', type: 'string' }
  ]
};

export const followTypes = {
  Follow: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' }
  ]
};

export const unfollowTypes = {
  Unfollow: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' }
  ]
};

export const subscribeTypes = {
  Subscribe: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' }
  ]
};

export const unsubscribeTypes = {
  Unsubscribe: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' }
  ]
};

export const profileTypes = {
  Profile: [
    { name: 'from', type: 'address' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'profile', type: 'string' }
  ]
};

export const aliasTypes = {
  Alias: [
    { name: 'from', type: 'address' },
    { name: 'alias', type: 'address' }
  ]
};
