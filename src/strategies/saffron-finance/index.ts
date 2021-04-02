import {formatUnits} from '@ethersproject/units';
import {BigNumber} from '@ethersproject/bignumber';
import {multicall} from '../../utils';

export const author = 'saffron.finance';
export const version = '0.1.0';

const BIG6 = BigNumber.from('1000000');
const BIG18 = BigNumber.from('1000000000000000000');
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

function dexLpToken(lpTypes: any[], lpName: string): string {
  const found = lpTypes.find(e => e.name === lpName);
  if (found === undefined) return "";
  return found.lpToken;
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

  // ================ Dex LP Token Reserve and Total Supply ==================
  let dexReserveData = new Array();
  let dexCalls = new Array();
  let dexQueryIdx = 0;
  options.dexLpTypes.forEach(dexToken => {
    let d = {
      name: dexToken.name,
      reservesQuery: [dexToken.lpToken, 'getReserves'],
      reserveQueryIdx: 0,
      reserve: 0,
      supplyQuery: [dexToken.lpToken, 'totalSupply'],
      supplyQueryIdx: 0,
      supply: 0,
      saffLpToSFI_E18: 0
    }
    dexCalls.push(d.reservesQuery);
    d.reserveQueryIdx = dexQueryIdx++;
    dexCalls.push(d.supplyQuery);
    d.supplyQueryIdx = dexQueryIdx++;
    dexReserveData.push(d);
  });

  const dexResponse = await multicall(
    network,
    provider,
    abi,
    [
      ...dexCalls
    ],
    {blockTag}
  );

  dexReserveData.forEach(drd => {
    drd.reserve = dexResponse[drd.reserveQueryIdx][0];
    drd.supply = dexResponse[drd.supplyQueryIdx][0];
    drd.saffLpToSFI_E18 = drd.reserve.mul(BIG18).div(drd.supply);
  });


  // ================== One to One Voting Power ==================
  let oneToOneData = new Array();
  for (let i = 0; i < options.oneToOne.length; i++) {
    let oto = options.oneToOne[i];
    let otoRecord = {
      label: oto.label,
      tokenAddress: oto.tokenAddress,
      otoQuery: addresses.map((address: any) => [
        oto.tokenAddress,
        'balanceOf',
        [address]
      ]),
      otoResponses: new Array(),
      votingScores: new Array()
    };
    otoRecord.otoResponses = await multicall(network, provider, abi, otoRecord.otoQuery, {blockTag});
    otoRecord.votingScores = addresses.map((address: any, index: number) => {
      return {address: address, score: otoRecord.otoResponses[index][0]}
    });
    oneToOneData.push(otoRecord);
  }

  // =============== Boosted with Multiplier Voting Power ================
  let boostMultiData = new Array();
  for (let i = 0; i < options.boostMultiply.length; i++) {
    let boost = options.boostMultiply[i];
    let boostRecord = {
      vote: boost.vote,
      tokens: new Array()
    };
    const voteBoost1000 = BigNumber.from(boostRecord.vote * 1000);
    const voteBoostDiv = BigNumber.from(1000);

    for (let j = 0; j < options.boostMultiply[i].tokens.length; j++) {
      let token = options.boostMultiply[i].tokens[j];
      let tokenRecord = {
        label: token.label,
        queries: new Array(),
        boostResponses: new Array(),
        votingScores: new Array()
      }
      let queries = addresses.map((address: any) => [
        token.tokenAddress,
        "balanceOf",
        [address]
      ]);
      tokenRecord.queries.push(queries);
      let response = await multicall(network, provider, abi, queries, {blockTag});
      tokenRecord.boostResponses.push(response);
      tokenRecord.votingScores = addresses.map((address: any, index: number) => {
        return {address: address, score: response[index][0].mul(voteBoost1000).div(voteBoostDiv)};
      });
      boostRecord.tokens.push(tokenRecord);
    }

    boostMultiData.push(boostRecord);
  }

  // ============= Dex Reserve LP Token Voting Power ==================
  let dexLpData = new Array();
  for (let i = 0; i < options.dexReserve.length; i++) {
    let dexReserve = options.dexReserve[i];
    let dexReserveRecord = {
      vote: dexReserve.vote,
      tokens: new Array()
    };
    let voteMult1000 = BigNumber.from(dexReserveRecord.vote * 1000);
    let voteDiv1000 = BigNumber.from(1000);

    for (let j = 0; j < options.dexReserve[i].dexLpTokens.length; j++) {
      let token = options.dexReserve[i].dexLpTokens[j];
      let tokenRecord = {
        label: token.label,
        dexLpType: token.dexLpType,
        queries: new Array(),
        responses: new Array(),
        votingScores: new Array()
      };
      let queries = addresses.map((address: any) => [
        token.tokenAddress,
        "balanceOf",
        [address]
      ]);
      tokenRecord.queries.push(queries);
      let response = await multicall(network, provider, abi, queries, {blockTag});
      tokenRecord.responses.push(response);
      tokenRecord.votingScores = addresses.map((address: any, index: number) => {
        let calculatedScore = response[index][0]
          .mul(dexReserveData.find(e => e.name === tokenRecord.dexLpType).saffLpToSFI_E18)
          .div(BIG18);
        return {address: address, score: calculatedScore.mul(voteMult1000).div(voteDiv1000)};
      });
      dexReserveRecord.tokens.push(tokenRecord);
    }

    dexLpData.push(dexReserveRecord)
  }

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
