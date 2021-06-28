import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';

import { subgraphRequest, ipfsGet } from '../../utils';

export const author = 'andytcf';
export const version = '1.0.0';

type SNXHoldersResult = {
  snxholders: {
    id: string;
    initialDebtOwnership: BigNumber;
    debtEntryAtIndex: BigNumber;
  }[];
};

const DebtCacheABI = [
  {
    constant: true,
    inputs: [],
    name: 'currentDebt',
    outputs: [
      { internalType: 'uint256', name: 'debt', type: 'uint256' },
      { internalType: 'bool', name: 'anyRateIsInvalid', type: 'bool' }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

const SynthetixStateABI = [
  {
    constant: true,
    inputs: [],
    name: 'lastDebtLedgerEntry',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

const SynthetixStateContractAddress =
  '0x4b9Ca5607f1fF8019c1C6A3c2f0CC8de622D5B82';
const DebtCacheContractAddress = '0x9bB05EF2cA7DBAafFC3da1939D1492e6b00F39b8';

const defaultGraphs = {
  '1': 'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix',
  '10':
    'https://api.thegraph.com/subgraphs/name/synthetixio-team/optimism-general'
};

const ovmSnapshotJSON = 'QmNwvhq4By1Mownjycg7bWSXqbJWMVyAWRZ1K4mjxuvGXg';

const HIGH_PRECISE_UNIT = 1e27;
const MED_PRECISE_UNIT = 1e18;
const SCALING_FACTOR = 1e5;

function returnGraphParams(snapshot: number | string, addresses: string[]) {
  return {
    snxholders: {
      __args: {
        where: {
          id_in: addresses.map((address: string) => address.toLowerCase())
        },
        first: 1000,
        block: {
          number: snapshot
        }
      },
      id: true,
      initialDebtOwnership: true,
      debtEntryAtIndex: true
    }
  };
}

const loadLastDebtLedgerEntry = async (
  provider: Provider,
  snapshot: number | string
) => {
  const contract = new Contract(
    SynthetixStateContractAddress,
    SynthetixStateABI,
    provider
  );
  const lastDebtLedgerEntry = await contract.lastDebtLedgerEntry({
    blockTag: snapshot
  });

  return BigNumber.from(lastDebtLedgerEntry);
};

const loadL1TotalDebt = async (
  provider: Provider,
  snapshot: number | string
) => {
  const contract = new Contract(
    DebtCacheContractAddress,
    DebtCacheABI,
    provider
  );

  const currentDebtObject = await contract.currentDebt({
    blockTag: snapshot
  });

  return Number(currentDebtObject.debt) / MED_PRECISE_UNIT;
};

const quadraticWeightedVoteL1 = async (
  initialDebtOwnership: BigNumber,
  debtEntryAtIndex: BigNumber,
  totalL1Debt: number,
  scaledTotalL2Debt: number,
  lastDebtLedgerEntry: BigNumber
) => {
  const currentDebtOwnershipPercent =
    (Number(lastDebtLedgerEntry) / Number(debtEntryAtIndex)) *
    Number(initialDebtOwnership);

  const highPrecisionBalance =
    totalL1Debt *
    MED_PRECISE_UNIT *
    (currentDebtOwnershipPercent / HIGH_PRECISE_UNIT);

  const currentDebtBalance = highPrecisionBalance / MED_PRECISE_UNIT;

  const totalDebtInSystem = totalL1Debt + scaledTotalL2Debt;

  let ownershipPercentOfTotalDebt = currentDebtBalance / totalDebtInSystem;

  const scaledWeighting = ownershipPercentOfTotalDebt * SCALING_FACTOR;

  return Math.sqrt(scaledWeighting);
};

const quadraticWeightedVoteL2 = async (
  initialDebtOwnership: BigNumber,
  totalL1Debt: number,
  scaledTotalL2Debt: number,
  normalisedL2CRatio: number
) => {
  const totalDebtInSystem = totalL1Debt + scaledTotalL2Debt;

  let ownershipPercentBN = Number(initialDebtOwnership) * normalisedL2CRatio;
  let ownershipPercent = ownershipPercentBN / HIGH_PRECISE_UNIT;
  let ownershipOfDebtDollarValue = ownershipPercent * scaledTotalL2Debt;
  let ownershipPercentOfTotalDebt =
    ownershipOfDebtDollarValue / totalDebtInSystem;

  const scaledWeighting = ownershipPercentOfTotalDebt * SCALING_FACTOR;
  return Math.sqrt(scaledWeighting);
};

export async function strategy(
  _space,
  _network,
  _provider,
  _addresses,
  _,
  snapshot
) {
  const score = {};

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const l1Results = (await subgraphRequest(
    defaultGraphs[1],
    returnGraphParams(blockTag, _addresses)
  )) as SNXHoldersResult;

  const normalisedL2CRatio = 1000 / 450;

  const totalL1Debt = await loadL1TotalDebt(_provider, snapshot); // (high-precision 1e18)
  const lastDebtLedgerEntry = await loadLastDebtLedgerEntry(
    _provider,
    snapshot
  );
  const totalL2Debt = 4792266; // $4,792,266 (high-precision 1e18)
  const scaledTotalL2Debt = totalL2Debt * normalisedL2CRatio;

  if (l1Results && l1Results.snxholders) {
    for (let i = 0; i < l1Results.snxholders.length; i++) {
      const holder = l1Results.snxholders[i];
      score[getAddress(holder.id)] = await quadraticWeightedVoteL1(
        holder.initialDebtOwnership,
        holder.debtEntryAtIndex,
        totalL1Debt,
        scaledTotalL2Debt,
        lastDebtLedgerEntry
      );
    }
  }

  const OVMSnapshot = await ipfsGet('gateway.pinata.cloud', ovmSnapshotJSON);

  const array = Object.assign(
    {},
    ...OVMSnapshot.data.snxholders.map((key) => ({
      [getAddress(key.id)]: key.initialDebtOwnership
    }))
  );

  for (let k = 0; k < _addresses.length; k++) {
    const address = _addresses[k];
    if (array[getAddress(address)]) {
      score[getAddress(address)] += await quadraticWeightedVoteL2(
        array[getAddress(address)],
        totalL1Debt,
        scaledTotalL2Debt,
        normalisedL2CRatio
      );
    } else {
      continue;
    }
  }

  return score || {};
}
