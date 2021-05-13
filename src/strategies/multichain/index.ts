import {subgraphRequest} from '../../utils';
import networks from '../../networks.json';
import {JsonRpcProvider} from "@ethersproject/providers";
import strategies from '..';

export const author = 'kesarito';
export const version = '1.0.0';

async function getChainBlockNumber(timestamp: number, graphURL: string): Promise<number> {
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

async function getChainBlocks(snapshot, provider, options, network): Promise<any> {

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const block = await provider.getBlock(blockTag);
  const chainBlocks = {};
  for (let strategy of options.strategies) {
    if (chainBlocks[strategy.network]) {
      continue;
    }
    if (strategy.network === network) {
      chainBlocks[strategy.network] = blockTag;
    } else {
      chainBlocks[strategy.network] = await getChainBlockNumber(block.timestamp, options.graphs[strategy.network]);
    }
  }

  return chainBlocks;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const promises: any = [];
  const chainBlocks = await getChainBlocks(snapshot, provider, options, network);

  for (let strategy of options.strategies) {
    promises.push(
      strategies[strategy.name](
        space,
        strategy.network,
        new JsonRpcProvider(networks[strategy.network].rpc[0]),
        addresses,
        strategy.params,
        chainBlocks[strategy.network]
      )
    );
  }
  const results = await Promise.all(promises);
  return results.reduce((finalResults: any, strategyResult: any) => {
    for (const [address, value] of Object.entries(strategyResult)) {
      if (!finalResults[address]) {
        finalResults[address] = 0;
      }

      finalResults[address] += value;
    }

    return finalResults;
  }, {});
}
