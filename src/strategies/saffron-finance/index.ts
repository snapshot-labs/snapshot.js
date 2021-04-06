import {formatUnits} from '@ethersproject/units';
import {BigNumber} from '@ethersproject/bignumber';
import {multicall} from '../../utils';

export const author = 'saffron.finance';
export const version = '0.1.0';

const BIG18 = BigNumber.from('1000000000000000000');
const VOTE_BOOST_DIV_1000 = BigNumber.from(1000);
const DECIMALS = 18;

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
    outputs: [{internalType: 'uint256', name: '', type: 'uint256'}],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
];

type Batch = {
  tag: string;
  qIdxStart: number;
  qIdxEnd: number;
}

type DexReserveSupply = {
  name: string;
  reservesQuery: string[];
  reserveQueryIdx: number;
  reserve: BigNumber;
  supplyQuery: string[];
  supplyQueryIdx: number,
  supply: BigNumber,
  saffLpToSFI_E18: BigNumber
}

type BoostRecord = {
  vote: number;
  tokens: TokenRecord[];
}

type VotingScore = {
  address: string;
  score: number;
}

type TokenRecord = {
  label: string;
  votingScores: VotingScore[];
}

type OneToOneRecord = {
  label: string;
  tokenAddress: string;
  votingScores: VotingScore[];
}

type DexRsvSupplyRecord = {

}

type DexTokenRecord = {
  label: string;
  dexLpType: string;
  votingScores: VotingScore[];
}

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
  const queryBatches: Array<Batch> = new Array<Batch>();
  let callQueryIndex = 0;
  const callIdxStart = 0;

  // ================ Dex LP Token Reserve and Total Supply ==================
  const dexReserveData = new Array<DexReserveSupply>();
  options.dexLpTypes.forEach(dexToken => {
    const d:DexReserveSupply = {
      name: dexToken.name,
      reservesQuery: [dexToken.lpToken, 'getReserves'],
      reserveQueryIdx: 0,
      reserve: BigNumber.from(0),
      supplyQuery: [dexToken.lpToken, 'totalSupply'],
      supplyQueryIdx: 0,
      supply: BigNumber.from(0),
      saffLpToSFI_E18: BigNumber.from(0)
    }
    callQueries.push(d.reservesQuery);
    d.reserveQueryIdx = callQueryIndex++;
    callQueries.push(d.supplyQuery);
    d.supplyQueryIdx = callQueryIndex++;
    dexReserveData.push(d);

    const batch = {tag: `${dexToken.name}`, qIdxStart: callIdxStart, qIdxEnd: callQueryIndex};
    queryBatches.push(batch);
  });

  // ================== One to One Voting Power ==================
  let oneToOneData = new Array<OneToOneRecord>();
  for (let i = 0; i < options.oneToOne.length; i++) {
    const oto = options.oneToOne[i];
    const otoRecord: OneToOneRecord = {
      label: oto.label,
      tokenAddress: oto.tokenAddress,
      votingScores: new Array<VotingScore>()
    };
    const queries = addresses.map((address: any) => [
      oto.tokenAddress,
      'balanceOf',
      [address]
    ]);
    let queriesLength = callQueries.push(...queries);
    const batch = {tag: oto.label, qIdxStart: callQueryIndex, qIdxEnd: queriesLength};
    callQueryIndex = queriesLength;
    queryBatches.push(batch);
    oneToOneData.push(otoRecord);
  }

  // =============== Boosted with Multiplier Voting Power ================
  const boostMultiData = new Array<BoostRecord>();
  for (let i = 0; i < options.boostMultiply.length; i++) {
    const boost = options.boostMultiply[i];
    const boostRecord = {
      vote: boost.vote,
      tokens: new Array<TokenRecord>()
    };

    for (let j = 0; j < options.boostMultiply[i].tokens.length; j++) {
      const token = options.boostMultiply[i].tokens[j];
      const tokenRecord = {
        label: token.label,
        votingScores: new Array<VotingScore>()
      }
      const queries = addresses.map((address: any) => [
        token.tokenAddress,
        "balanceOf",
        [address]
      ]);
      const queriesLength = callQueries.push(...queries);
      const batch = {tag: tokenRecord.label, qIdxStart: callQueryIndex, qIdxEnd: queriesLength};
      callQueryIndex = queriesLength;
      queryBatches.push(batch);
      boostRecord.tokens.push(tokenRecord);
    }

    boostMultiData.push(boostRecord);
  }

  // ============= Dex Reserve LP Token Voting Power ==================
  const dexLpData = new Array<DexRsvSupplyRecord>();
  for (let i = 0; i < options.dexReserve.length; i++) {
    const dexReserve = options.dexReserve[i];
    const dexReserveRecord = {
      vote: dexReserve.vote,
      tokens: new Array<DexTokenRecord>()
    };

    for (let j = 0; j < options.dexReserve[i].dexLpTokens.length; j++) {
      const token = options.dexReserve[i].dexLpTokens[j];
      const tokenRecord = {
        label: token.label,
        dexLpType: token.dexLpType,
        votingScores: new Array<VotingScore>()
      };
      const queries = addresses.map((address: any) => [
        token.tokenAddress,
        "balanceOf",
        [address]
      ]);
      const queriesLength = callQueries.push(...queries);
      const batch = {tag: tokenRecord.label, qIdxStart: callQueryIndex, qIdxEnd: queriesLength};
      callQueryIndex = queriesLength;
      queryBatches.push(batch);
      dexReserveRecord.tokens.push(tokenRecord);
    }

    dexLpData.push(dexReserveRecord)
  }

  // Run queries
  callResponses = await multicall(network, provider, abi, callQueries, {blockTag});

  // Extract and processes query responses
  dexReserveData.forEach(drd => {
    drd.reserve = callResponses[drd.reserveQueryIdx][0];
    drd.supply = callResponses[drd.supplyQueryIdx][0];
    drd.saffLpToSFI_E18 = drd.reserve.mul(BIG18).div(drd.supply);
  });

  oneToOneData.forEach(otoRecord => {
    let batch = queryBatches.find(e => e.tag === otoRecord.label);
    if (batch === undefined) {
      throw Error(`oneToOneData batch must have tag of ${otoRecord.label}`);
    }
    let idxStart = batch.qIdxStart;
    otoRecord.votingScores = addresses.map((address: any, index: number) => {
      return {address: address, score: callResponses[idxStart+index][0]}
    });
  });

  boostMultiData.forEach((boost: any) => {
    const voteBoost1000 = BigNumber.from(boost.vote * 1000);

    boost.tokens.forEach((tokenRecord: any) => {
      let batch = queryBatches.find(e => e.tag === tokenRecord.label);
      if (batch === undefined) {
        throw Error(`boostMultiData batch must have tag of ${tokenRecord.label}`);
      }
      let idxStart = batch.qIdxStart;
      tokenRecord.votingScores = addresses.map((address: any, index: number) => {
        return {address: address, score: callResponses[idxStart+index][0].mul(voteBoost1000).div(VOTE_BOOST_DIV_1000)};
      });
    });
  });

  dexLpData.forEach((dexReserveRecord: any) => {
    let voteMult1000 = BigNumber.from(dexReserveRecord.vote * 1000);
    dexReserveRecord.tokens.forEach((tokenRecord: any) => {
      let batch = queryBatches.find(e => e.tag === tokenRecord.label);
      if (batch === undefined) {
        throw Error(`boostMultiData batch must have tag of ${tokenRecord.label}`);
      }
      let idxStart = batch.qIdxStart;
      tokenRecord.votingScores = addresses.map((address: any, index: number) => {
        const dexData = dexReserveData.find(e => e.name === tokenRecord.dexLpType);
        if (dexData === undefined) {
          throw Error(`Failed to locate token LP data for ${tokenRecord.dexLpType}.`);
        }
        const calculatedScore = callResponses[idxStart+index][0]
          .mul(dexData.saffLpToSFI_E18)
          .div(BIG18);
        return {address: address, score: calculatedScore.mul(voteMult1000).div(VOTE_BOOST_DIV_1000)};
      });
    });
  });


  // ================ Sum up everything =================
  let addressVotingScore = addresses.map((address: any, index: number) => {
    let total = BigNumber.from(0);
    oneToOneData.forEach((otod: any) => {
      let otoScore = otod.votingScores[index];
      if (otoScore.address === address) {
        total = total.add(otoScore.score);
      } else {
        console.error(`${otod.label} expected address, ${address}, found ${otoScore.address}`);
      }
    });

    boostMultiData.forEach((boost: any) => {
      boost.tokens.forEach((tokenRecord: any) => {
        let boostScore = tokenRecord.votingScores[index];
        if (boostScore.address === address) {
          total = total.add(boostScore.score);
        } else {
          console.error(`{$tokenRecord.label} expected address, ${address}, found ${boostScore.address}`);
        }
      });
    });

    dexLpData.forEach((dexLp: any) => {
      dexLp.tokens.forEach((dexLpToken: any) => {
        let dexLpScore = dexLpToken.votingScores[index];
        if (dexLpScore.address === address) {
          total = total.add(dexLpScore.score);
        } else {
          console.error(`{$tokenRecord.label} expected address, ${address}, found ${dexLpScore.address}`);
        }
      });
    });

    // Return single record { address, score } where score should have exponent of 18
    return {address: address, score: total}
  });

  return Object.fromEntries(
    addressVotingScore.map((addressVote) => {
      return [
        addressVote.address,
        parseFloat(formatUnits(addressVote.score, DECIMALS))
      ];
    })
  );
}
