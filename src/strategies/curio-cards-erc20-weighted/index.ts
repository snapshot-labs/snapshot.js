import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'fafrd';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const curioAddresses = {
    CRO1: '0x6aa2044c7a0f9e2758edae97247b03a0d7e73d6c',
    CRO2: '0xe9a6a26598b05db855483ff5ecc5f1d0c81140c8',
    CRO3: '0x3f8131b6e62472ceea9cb8aa67d87425248a3702',
    CRO4: '0x4f1694be039e447b729ab11653304232ae143c69',
    CRO5: '0x5a3d4a8575a688b53e8b270b5c1f26fd63065219',
    CRO6: '0x1ca6ac0ce771094f0f8a383d46bf3acc9a5bf27f',
    CRO7: '0x2647bd8777e0c66819d74ab3479372ea690912c3',
    CRO8: '0x2fce2713a561bb019bc5a110be0a19d10581ee9e',
    CRO9: '0xbf4cc966f1e726087c5c55aac374e687000d4d45',
    CRO10: '0x72b34d637c0d14ace58359ef1bf472e4b4c57125',
    CRO11: '0xb36c87f1f1539c5fc6f6e7b1c632e1840c9b66b4',
    CRO12: '0xd15af10a258432e7227367499e785c3532b50271',
    CRO13: '0x2d922712f5e99428c65b44f09ea389373d185bb3',
    CRO14: '0x0565ac44e5119a3224b897de761a46a92aa28ae8',
    CRO15: '0xdb7f262237ad8acca8922aa2c693a34d0d13e8fe',
    CRO16: '0x1b63532ccb1fee0595c7fe2cb35cfd70ddf862cd',
    CRO17: '0xf59536290906f204c3c7918d40c1cc5f99643d0b',
    CRO18: '0xa507d9d28bbca54cbcffad4bb770c2ea0519f4f0',
    CRO19: '0xf26bc97aa8afe176e275cf3b08c363f09de371fa',
    CRO20: '0xd0ec99e99ce22f2487283a087614aee37f6b1283',
    CRO21: '0xb7a5a84ff90e8ef91250fb56c50a7bb92a6306ee',
    CRO22: '0x148ff761d16632da89f3d30ef3dfe34bc50ca765',
    CRO23: '0xcde7185b5c3ed9ea68605a960f6653aa1a5b5c6c',
    CRO24: '0xe67dad99c44547b54367e3e60fc251fc45a145c6',
    CRO25: '0xc7f60c2b1dbdfd511685501edeb05c4194d67018',
    CRO26: '0x1cb5bf4be53eb141b56f7e4bb36345a353b5488c',
    CRO27: '0xfb9f3fa2502d01d43167a0a6e80be03171df407e',
    CRO28: '0x59d190e8a2583c67e62eec8da5ea7f050d8bf27e',
    CRO29: '0xd3540bcd9c2819771f9d765edc189cbd915feabd',
    CRO30: '0x7f5b230dc580d1e67df6ed30dee82684dd113d1f'
  };

  // Total supply pulled from https://fafrd.github.io/curio-gallery data
  // Note that the total supply values here are TENTATIVE and NEED TO BE VERIFIED!!!
  // 1. Many tokens have been burned or are locked in the vendor contract.
  // 2. The card contracts do not fully follow ERC20 spec- they do not emit 'Transfer' events,
  //    which causes tools like etherscan to mis-report p2p transfers.
  // 3. Several hundred tokens have been locked in the bugged erc1155 contract and are irretrievable
  // The other option is to pull supply data from http://dogestreet.com/curio/, but I also don't know where this is sourced from
  //    for example, the CRO7 total supply on that site looks lower than it should be.
  // For now this data should be considered a rough approximation of total supply.
  const curioSupply = {
    CRO1: 1817,
    CRO2: 1576,
    CRO3: 1627,
    CRO4: 465,
    CRO5: 438,
    CRO6: 424,
    CRO7: 2006,
    CRO8: 2002,
    CRO9: 2009,
    CRO10: 1999,
    CRO11: 1999,
    CRO12: 1998,
    CRO13: 2000,
    CRO14: 500,
    CRO15: 499,
    CRO16: 497,
    CRO17: 508,
    CRO18: 500,
    CRO19: 500,
    CRO20: 1996,
    CRO21: 497,
    CRO22: 500,
    CRO23: 250,
    CRO24: 333,
    CRO25: 222,
    CRO26: 106,
    CRO27: 603,
    CRO28: 397,
    CRO29: 197,
    CRO30: 823
  };

  // Calculate weights for all cards.
  // for each card, vote weight = 1/(total supply) * constant
  const curioWeights = {};
  Object.keys(curioSupply).map((k) => {
    curioWeights[k] = (1_000 * 1) / curioSupply[k];
  });

  // Given a card and address-tokencount mapping,
  // calculate the weight for this card.
  // i.e., assuming card CRO01 had weight 1.5,
  //       given  {'0x123': 2, '0x456': 4}
  //       return {'0x123': 3, '0x456': 6}
  function applyWeightForCard(cardName, addressHoldings) {
    const weight = curioWeights[cardName];
    let result = {};

    Object.keys(addressHoldings).map((k) => {
      result[k] = addressHoldings[k] * weight;
    });

    return result;
  }

  // Sums multiple address-voteweight mappings into a single object.
  // i.e., given [{'0x123': 1, '0x456': 2}, {'0x123': 10, '0x456': 20}]
  //       return {'0x123': 11, '0x456': 22}
  function sumAddressWeights(arrayOfWeights) {
    return arrayOfWeights.reduce((sum, current) => {
      for (let k in current) {
        sum[k] = (sum[k] || 0) + current[k];
      }
      return sum;
    }, {});
  }

  // helper
  async function returnPromiseWithContext(promise, context) {
    const ret = await promise;
    return { rv: ret, context: context };
  }

  // Prepare to fetch erc20 balances
  let cardBalancePromises: Promise<{ rv: any; context: any }>[] = [];
  Object.keys(curioAddresses).forEach((cardName) =>
    cardBalancePromises.push(
      returnPromiseWithContext(
        erc20BalanceOfStrategy(
          space,
          network,
          provider,
          addresses,
          { address: curioAddresses[cardName], decimals: 0, start: 3678637 },
          snapshot
        ),
        cardName
      )
    )
  );

  // Execute erc20 balance fetch in parallel
  return await Promise.all(cardBalancePromises)
    .then((cardBalances) => {
      // then transform token balance -> vote weight
      let cardBalancesWeighted: Array<any> = [];

      cardBalances.forEach((cb) => {
        const cbWeighted = applyWeightForCard(cb.context, cb.rv);
        console.debug(
          'Weighting for card ' +
            cb.context +
            ':\n' +
            JSON.stringify(cbWeighted, null, 2)
        );
        cardBalancesWeighted.push(cbWeighted);
      });

      return cardBalancesWeighted;
    })
    .then((cardBalancesWeighted) => {
      // finally, sum card balances
      return sumAddressWeights(cardBalancesWeighted);
    });
}
