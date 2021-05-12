import { formatUnits } from '@ethersproject/units';
import { multicall, subgraphRequest } from '../../utils';
import networks from '../../networks.json';
import {JsonRpcProvider} from "@ethersproject/providers";

export const author = 'kesarito';
export const version = '1.0.0';

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
  }
];

const MATIC_BLOCK_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/elkfinance/matic-blocks';

async function getMaticBlockNumber (timestamp: number): Promise<number> {
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
  const data = await subgraphRequest(MATIC_BLOCK_SUBGRAPH_URL, query);
  return Number(data.blocks[0].number);
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
  const [responseEthereum, block] = await Promise.all([multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.ethereum, 'balanceOf', [address]]),
    { blockTag }
  ), provider.getBlock(blockTag)]);

  const snapshotMaticBlock = await getMaticBlockNumber(block.timestamp);

  const responseMatic = await multicall(
    "137",
    new JsonRpcProvider(networks[137].rpc[0]),
    abi,
    addresses.map((address: any) => [options.matic, 'balanceOf', [address]]),
    { blockTag: snapshotMaticBlock }
  );

  // TODO: merge in 1 call
  const responseMaticLocked = await multicall(
    "137",
    new JsonRpcProvider(networks[137].rpc[0]),
    abi,
    addresses.map((address: any) => [options.maticLocked, 'balanceOf', [address]]),
    { blockTag: snapshotMaticBlock }
  );

  // TODO: get BSC

  return Object.fromEntries(
    responseEthereum.map((value, i) => {
      return [
        addresses[i],
        parseFloat(formatUnits(value[0].add(responseMatic[i][0]).add(responseMaticLocked[i][0]).toString(), 18))
      ]
    })
  );
}
