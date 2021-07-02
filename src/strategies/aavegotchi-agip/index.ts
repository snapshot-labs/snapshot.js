import { formatUnits } from '@ethersproject/units';
import Multicaller from '../../utils/multicaller';
import { subgraphRequest } from '../../utils';
export const author = 'candoizo';
export const version = '0.1.0';

const AAVEGOTCHI_SUBGRAPH_URL = {
  137: 'https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic'
};

let tokenAbi = [
  {
    inputs: [{ internalType: 'address', name: '_account', type: 'address' }],
    name: 'itemBalances',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'itemId', type: 'uint256' },
          { internalType: 'uint256', name: 'balance', type: 'uint256' }
        ],
        internalType: 'struct ItemsFacet.ItemIdIO[]',
        name: 'bals_',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const itemPriceParams = {
  itemTypes: {
    __args: {
      first: 1000
    },
    svgId: true,
    ghstPrice: true
  }
};

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  let blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  let multi = new Multicaller(network, provider, tokenAbi, { blockTag });
  addresses.map((addr: string) =>
    multi.call(
      `${options.tokenAddress}.${addr.toLowerCase()}`,
      options.tokenAddress,
      'itemBalances',
      [addr]
    )
  );
  let multiRes = await multi.execute();

  let walletQueryParams = {
    users: {
      __args: {
        where: {
          id_in: addresses.map((addr: string) => addr.toLowerCase())
        },
        first: 1000
      },
      id: true,
      gotchisOwned: {
        baseRarityScore: true,
        equippedWearables: true
      }
    }
  };
  let result = await subgraphRequest(AAVEGOTCHI_SUBGRAPH_URL[network], {
    ...itemPriceParams,
    ...walletQueryParams
  });
  let prices = {};
  result.itemTypes.map((itemInfo) => {
    let itemValue = parseFloat(formatUnits(itemInfo.ghstPrice, 18));
    if (itemValue > 0) prices[parseInt(itemInfo.svgId)] = itemValue;
  });

  let walletScores = {};
  result.users.map((addrInfo) => {
    let { id, gotchisOwned } = addrInfo;
    let gotchisBrsEquipValue = 0;
    if (gotchisOwned.length > 0)
      gotchisOwned.map((gotchi) => {
        let brs = parseInt(gotchi.baseRarityScore);
        gotchisBrsEquipValue += brs;
        gotchi.equippedWearables
          .filter((itemId: number) => itemId != 0)
          .map((itemId) => {
            let shopCost = prices[itemId];
            if (isNaN(shopCost)) shopCost = 0;
            gotchisBrsEquipValue += shopCost;
          });
      });

    let ownerItemValue = 0;
    let ownerItemInfo = multiRes[options.tokenAddress][id];
    if (ownerItemInfo.length > 0)
      ownerItemInfo.map((itemInfo) => {
        let amountOwned = parseInt(itemInfo.balance.toString());
        let itemId = parseInt(itemInfo.itemId.toString());
        let pricetag = parseFloat(prices[itemId]);
        let cost = pricetag * amountOwned;
        if (isNaN(cost)) cost = 0;
        ownerItemValue += cost;
      });

    let addr = addresses.find(
      (addrOption: string) => addrOption.toLowerCase() === id
    );
    walletScores[addr] = ownerItemValue + gotchisBrsEquipValue;
  });
  addresses.map((addr) => {
    if (!walletScores[addr]) walletScores[addr] = 0;
  });

  return walletScores;
}
