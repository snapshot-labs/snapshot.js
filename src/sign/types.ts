export interface Proposal {
  space: string;
  timestamp: number;
  type: string;
  title: string;
  body: string;
  choices: string[];
  start: number;
  end: number;
  snapshot: number;
  network: string;
  strategies: string;
  plugins: string;
  metadata: string;
}

export interface Vote {
  space: string;
  timestamp: number;
  proposal: string;
  choice: number;
  metadata: string;
}

export const proposalTypes = {
  Proposal: [
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'type', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'body', type: 'string' },
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

export const voteTypes = {
  Vote: [
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    // { name: 'proposal', type: 'bytes32' },
    { name: 'proposal', type: 'string' },
    { name: 'choice', type: 'uint32' },
    { name: 'metadata', type: 'string' }
  ]
};
