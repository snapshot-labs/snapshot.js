import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { subgraphRequest, ipfsGet } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'andytcf';
export const version = '1.0.0';

type SNXHoldersResult = {
  snxholders: {
    id: string;
    initialDebtOwnership: BigNumber;
  }[];
};

const defaultGraphs = {
  '1': 'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix',
  '10':
    'https://api.thegraph.com/subgraphs/name/synthetixio-team/optimism-general'
};

const ovmSnapshotJSON = 'QmNwvhq4By1Mownjycg7bWSXqbJWMVyAWRZ1K4mjxuvGXg';

function returnGraphParams(blockNumber: number | string, addresses: string[]) {
  return {
    snxholders: {
      __args: {
        where: {
          id_in: addresses.map((address: string) => address.toLowerCase())
        },
        first: 1000,
        block: {
          number: blockNumber
        }
      },
      id: true,
      initialDebtOwnership: true
    }
  };
}

const quadraticWeighting = (value: BigNumber, isL2: boolean) => {
  const totalL1Debt = 252029469; // $252,029,469
  const totalL2Debt = 4792266; // $4,792,266

  const normalisedL2CRatio = 1000 / 450;

  // $10,649,480
  const scaledTotalL2Debt = totalL2Debt * normalisedL2CRatio; // L2 debt normalised to L1 c-ratio;

  // $262,678,949
  const totalDebtInSystem = totalL1Debt + scaledTotalL2Debt;

  let ownershipPercentBN: any;
  let ownershipPercent: any;
  let ownershipOfDebtDollarValue: any;
  let ownershipPercentOfTotalDebt: any;

  if (isL2) {
    ownershipPercentBN = Number(value) * normalisedL2CRatio;
  } else {
    ownershipPercentBN = Number(value);
  }

  ownershipPercent = ownershipPercentBN / 1e27;

  if (isL2) {
    ownershipOfDebtDollarValue = ownershipPercent * scaledTotalL2Debt;
  } else {
    ownershipOfDebtDollarValue = ownershipPercent * totalL1Debt;
  }
  ownershipPercentOfTotalDebt = ownershipOfDebtDollarValue / totalDebtInSystem;

  const scaledWeighting = ownershipPercentOfTotalDebt * 1e5;
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

  // const ovmResults = (await subgraphRequest(
  //   defaultGraphs[10],
  //   returnGraphParams(53125, _addresses)
  // )) as SNXHoldersResult;

  if (l1Results && l1Results.snxholders) {
    l1Results.snxholders.forEach((holder) => {
      score[getAddress(holder.id)] = quadraticWeighting(
        holder.initialDebtOwnership,
        false
      );
    });
  }

  const OVMSnapshot = await ipfsGet('gateway.pinata.cloud', ovmSnapshotJSON);

  const array = Object.assign(
    {},
    ...OVMSnapshot.data.snxholders.map((key) => ({
      [getAddress(key.id)]: key.initialDebtOwnership
    }))
  );

  _addresses.map((address) => {
    if (array[getAddress(address)]) {
      score[getAddress(address)] += quadraticWeighting(
        array[getAddress(address)],
        true
      );
    }
  });

  // if (ovmResults && ovmResults.snxholders) {
  //   ovmResults.snxholders.forEach((holder) => {
  //     if (score[getAddress(holder.id)] > 0) {
  //       score[getAddress(holder.id)] += quadraticWeighting(
  //         holder.initialDebtOwnership
  //       );
  //     } else {
  //       score[getAddress(holder.id)] = quadraticWeighting(
  //         holder.initialDebtOwnership
  //       );
  //     }
  //   });
  // }

  return score || {};
}
