import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';
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

async function getChainBlockNumber(
  timestamp: number,
  graphURL: string
): Promise<number> {
  const query = {
    blocks: {
      __args: {
        first: 1,
        orderBy: 'number',
        orderDirection: 'desc',
        where: {
          timestamp_lte: timestamp
        }
      },
      number: true,
      timestamp: true
    }
  };
  const data = await subgraphRequest(graphURL, query);
  return Number(data.blocks[0].number);
}

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

const quadraticWeighting = (value: BigNumber) => {
  // Scale the value by 100000
  const scaledValue = parseFloat(formatUnits(value.toString(), 27)) * 1e5;
  return Math.sqrt(scaledValue);
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
  const block = await _provider.getBlock(blockTag);

  const ovmBlocknumber = await getChainBlockNumber(
    block.timestamp,
    defaultGraphs[10]
  );

  const l1Results = (await subgraphRequest(
    defaultGraphs[1],
    returnGraphParams(blockTag, _addresses)
  )) as SNXHoldersResult;

  const ovmResults = (await subgraphRequest(
    defaultGraphs[10],
    returnGraphParams(ovmBlocknumber, _addresses)
  )) as SNXHoldersResult;

  if (l1Results && l1Results.snxholders) {
    l1Results.snxholders.forEach((holder) => {
      score[getAddress(holder.id)] = quadraticWeighting(
        holder.initialDebtOwnership
      );
    });
  }

  if (ovmResults && ovmResults.snxholders) {
    ovmResults.snxholders.forEach((holder) => {
      if (score[getAddress(holder.id)] > 0) {
        score[getAddress(holder.id)] += quadraticWeighting(
          holder.initialDebtOwnership
        );
      } else {
        score[getAddress(holder.id)] = quadraticWeighting(
          holder.initialDebtOwnership
        );
      }
    });
  }

  return score || {};
}
