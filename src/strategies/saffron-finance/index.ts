import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';

export const author = 'saffron.finance';
export const version = '0.1.0';

const BIG18 = BigNumber.from('1000000000000000000');
const VOTE_BOOST_DIV_1000 = BigNumber.from(1000);
const DECIMALS = 18;
const QUERIES_PER_DEX_LP_PAIR = 2;

const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      {
        internalType: 'uint112',
        name: '_reserve0',
        type: 'uint112'
      },
      {
        internalType: 'uint112',
        name: '_reserve1',
        type: 'uint112'
      },
      {
        internalType: 'uint32',
        name: '_blockTimestampLast',
        type: 'uint32'
      }
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

// VotingScheme is an interface that provides one method for invoking a concrete implementation of different
// ways to calculate a score when given a raw balance from a Saffron LP token.
interface VotingScheme {
  doAlgorithm(balance: BigNumber): BigNumber;
}

// DirectBoostScheme provides logic to apply a multiplier, or boost, to a raw balance value. This gives
// Saffron Finance the ability to adjust the voting power a token holder has depending external configuration.
//
// name       ... unique string that identifies the instance of the VotingScheme
// multiplier ... the raw balance value is multiplied by the multiplier such that: score = (multiplier)(balance).
//                If this value is 1.0, it is equivalent to score = balance.
//                If this value is less than 1.0 and greater than 0.0, then the token holder's voting power is reduced.
//                If this value is 0.0, then the token holder has no voting power.
class DirectBoostScheme implements VotingScheme {
  private name: string;
  private multiplier: number;

  constructor(name: string, multiplier) {
    this.name = name;
    this.multiplier = multiplier;
  }

  public doAlgorithm(balance: BigNumber): BigNumber {
    const voteBoost1000 = BigNumber.from(this.multiplier * 1000);
    return balance.mul(voteBoost1000).div(VOTE_BOOST_DIV_1000);
  }
}

// LPReservePairScheme provides logic to apply a voting score to only the SFI side of a Uniswap or Sushiswap LP token
// pair.
//
// name            ... unique string that identifies the instance of the VotingScheme
// multiplier ... the raw balance value is multiplied by the multiplier such that: score = (multiplier)(balance).
//                If this value is 1.0, it is equivalent to score = balance.
//                If this value is less than 1.0 and greater than 0.0, then the token holder's voting power is reduced.
//                If this value is 0.0, then the token holder has no voting power.
// saffLpToSfi_E18 ... Conversion of the Saffron LP Pair Token holding to SFI value with expected value to be in wei.
class LPReservePairScheme implements VotingScheme {
  private name: string;
  private multiplier: number;
  private saffLpToSfi_E18: BigNumber;

  constructor(name: string, multiplier: number, saffLpToSfi_E18: BigNumber) {
    this.name = name;
    this.multiplier = multiplier;
    this.saffLpToSfi_E18 = saffLpToSfi_E18;
  }

  doAlgorithm(balance: BigNumber): BigNumber {
    const voteMult1000 = BigNumber.from(this.multiplier * 1000);
    const calculatedScore = balance.mul(this.saffLpToSfi_E18).div(BIG18);
    return calculatedScore.mul(voteMult1000).div(VOTE_BOOST_DIV_1000);
  }
}

// VoteScorer acts as the context to invoke the relevant VotingScheme by way of its calculateScore method.
// It assumes all VotingScheme's are created by the createVotingScheme method prior to invocation of calculateScore.
//
// votingSchemes    ...  A Map that provides keyed access to a VotingScheme instance.
// dexReserveData   ...  An Array that holds necessary Uniswap and Sushiswap LP Pair Token data for LPReservePairScheme.
class VoteScorer {
  private votingSchemes: Map<string, VotingScheme> = new Map<
    string,
    VotingScheme
  >();
  private dexReserveData: Array<DexReserveSupply> = new Array<DexReserveSupply>();

  constructor(dexReserveData: Array<DexReserveSupply>) {
    this.dexReserveData = dexReserveData;
    this.votingSchemes.set('default', new DirectBoostScheme('default', 1.0));
  }

  public createVotingScheme(name: string, type: string, multiplier: number) {
    let votingScheme: VotingScheme = new DirectBoostScheme(
      'no-vote-scheme',
      0.0
    );
    if (type === 'DirectBoostScheme') {
      votingScheme = new DirectBoostScheme(name, multiplier);
    } else if (type === 'LPReservePairScheme') {
      const lpReservePairData = this.dexReserveData.find(
        (e) => e.name === name
      );
      if (lpReservePairData === undefined) {
        throw Error(`Failed to locate token LP Pair data for ${name}.`);
      }
      votingScheme = new LPReservePairScheme(
        name,
        multiplier,
        lpReservePairData.saffLpToSFI_E18
      );
    } else {
      throw new Error(`Unsupported voting scheme type, ${type}.`);
    }
    this.votingSchemes.set(name, votingScheme);
  }

  public calculateScore(schemeName: string, balance: BigNumber) {
    const votingScheme = this.votingSchemes.get(schemeName);
    if (votingScheme === undefined) {
      throw new Error(
        `Failed to locate voting scheme, ${schemeName}. Check initialization of votingSchemes.`
      );
    }
    return votingScheme.doAlgorithm(balance);
  }
}

// Batch represents a batch record that tracks a grouping of calls made by Multicall. The qIdxStart and qIdxEnd
// indicate the beginning and ending indices of the callQueries array.
type Batch = {
  tag: string;
  votingScheme: string;
  qIdxStart: number;
  qIdxEnd: number;
};

// DexReserveSupply is a single record that holds the queries for the values of a LP Pair token's reserves and
// supply. It also acts as a record for the calculated value for converting a Saffron LP toke holding to SFI.
type DexReserveSupply = {
  name: string;
  reservesQuery: string[];
  reserveQueryIdx: number;
  reserve: BigNumber;
  supplyQuery: string[];
  supplyQueryIdx: number;
  supply: BigNumber;
  saffLpToSFI_E18: BigNumber;
};

// VotingScore is a single voting score for the address. Each address from addresses will have one VotingScore for
// each contract in options.contracts.
type VotingScore = {
  address: string;
  score: number;
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const callQueries: Array<any[]> = new Array<any[]>();
  let callResponses: Array<any> = new Array<any>();
  const holdersQueryBatches: Array<Batch> = new Array<Batch>();
  const votingScores: Array<VotingScore> = new Array<VotingScore>();
  let callQueryIndex = 0;
  let dexLpCallIdxStart = 0;

  // ================ LP Pair Token Reserve and Total Supply ==================
  const dexReserveData = new Array<DexReserveSupply>();
  options.dexLpTypes.forEach((dexToken) => {
    const d: DexReserveSupply = {
      name: dexToken.name,
      reservesQuery: [dexToken.lpToken, 'getReserves'],
      reserveQueryIdx: 0,
      reserve: BigNumber.from(0),
      supplyQuery: [dexToken.lpToken, 'totalSupply'],
      supplyQueryIdx: 0,
      supply: BigNumber.from(0),
      saffLpToSFI_E18: BigNumber.from(0)
    };
    callQueries.push(d.reservesQuery);
    d.reserveQueryIdx = callQueryIndex++;
    callQueries.push(d.supplyQuery);
    d.supplyQueryIdx = callQueryIndex++;
    dexReserveData.push(d);

    dexLpCallIdxStart = callQueryIndex;
  });

  // ============= Multicall queries ==============
  options.contracts.forEach((contract) => {
    const queries = addresses.map((address: any) => {
      return [contract.tokenAddress, 'balanceOf', [address]];
    });
    const queriesLength = callQueries.push(...queries);
    const batch = {
      tag: contract.label,
      votingScheme: contract.votingScheme,
      qIdxStart: callQueryIndex,
      qIdxEnd: queriesLength
    };
    callQueryIndex = queriesLength;
    holdersQueryBatches.push(batch);
  });

  // Run queries
  callResponses = await multicall(network, provider, abi, callQueries, {
    blockTag
  });

  // ========== Extract and process query responses ==========
  dexReserveData.forEach((drd) => {
    drd.reserve = callResponses[drd.reserveQueryIdx][0];
    drd.supply = callResponses[drd.supplyQueryIdx][0];
    drd.saffLpToSFI_E18 = drd.reserve.mul(BIG18).div(drd.supply);
  });

  // ========== Build the voting schemes and calculate individual scores ============
  const voteScorer: VoteScorer = new VoteScorer(dexReserveData);
  options.votingSchemes.forEach((scheme) => {
    voteScorer.createVotingScheme(scheme.name, scheme.type, scheme.multiplier);
  });

  // Push empty Voting Score elements to the votingScores array. This allows Batch.qIdxStart to
  // correspond correctly to votingScores.
  const emptyVotingScoreCountToAdd =
    dexReserveData.length * QUERIES_PER_DEX_LP_PAIR;
  const emptyVote: VotingScore = { address: '0x00', score: 0.0 };
  for (let i = 0; i < emptyVotingScoreCountToAdd; i++) {
    votingScores.push(emptyVote);
  }

  options.contracts.forEach((contract) => {
    const batch = holdersQueryBatches.find((e) => e.tag === contract.label);
    if (batch === undefined) {
      throw new Error(
        `Failed to locate tag, ${contract.label}, in queryBatches.`
      );
    }
    let idxStart = batch.qIdxStart;
    const batchScores = addresses.map((address: any, index: number) => {
      return {
        address: address,
        score: voteScorer.calculateScore(
          contract.votingScheme,
          callResponses[idxStart + index][0]
        )
      };
    });
    votingScores.push(...batchScores);
  });

  // ================ Sum up everything =================
  let addressVotingScore = addresses.map(
    (address: any, addressIndex: number) => {
      let total = BigNumber.from(0);
      holdersQueryBatches.forEach((batch: Batch) => {
        let votingScore = votingScores[batch.qIdxStart + addressIndex];
        if (votingScore === undefined) {
          throw new Error(
            `Expected a votingScore at batch.qIdxStart: ${batch.qIdxStart}, addressIndex: ${addressIndex}`
          );
        }
        if (votingScore.address === address) {
          total = total.add(votingScore.score);
        } else {
          throw new Error(
            `${batch.tag} expected address, ${address}, found ${votingScore.address}`
          );
        }
      });

      // Return single record { address, score } where score should have exponent of 18
      return { address: address, score: total };
    }
  );

  return Object.fromEntries(
    addressVotingScore.map((addressVote) => {
      return [
        addressVote.address,
        parseFloat(formatUnits(addressVote.score, DECIMALS))
      ];
    })
  );
}
