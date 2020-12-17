export interface ElasticSearchTxResult {
  took: number;
  timed_out: boolean;
  _shards: Shards;
  hits: Hits;
}

export interface Shards {
  total: number;
  successful: number;
  skipped: number;
  failed: number;
}

export interface Hits {
  total: Total;
  max_score: number;
  hits: Hit[];
}

export interface Hit {
  _index: Index;
  _type: Type;
  _id: string;
  _score: number;
  _source: Source;
}

export enum Index {
  The0011EthereumEthereumMainnetTx = '0011-ethereum-ethereum-mainnet-tx'
}

export interface Source {
  blockHash: string;
  blockNumber: BlockNumber;
  cumulativeGasUsed: BlockNumber;
  from: string;
  gas: BlockNumber;
  gasPrice: BlockNumber;
  gasUsed: BlockNumber;
  hash: string;
  input: string;
  logsBloom: string;
  nonce: BlockNumber;
  r: string;
  s: string;
  status: boolean;
  timestamp: number;
  to: string;
  publicKey?: string;
  transactionIndex: BlockNumber;
  standardV?: string;
  v: V;
  value: Value;
}

export interface BlockNumber {
  raw: string;
  num: number;
}

export enum V {
  The0X25 = '0x25',
  The0X26 = '0x26'
}

export interface Value {
  raw: string;
  padded: string;
  eth: number;
  num: number;
}

export enum Type {
  Doc = '_doc'
}

export interface Total {
  value: number;
  relation: string;
}
