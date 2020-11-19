import { subgraphRequest } from '../../utils';

const OMEN_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/protofire/omen',
  '4': 'https://api.thegraph.com/subgraphs/name/protofire/omen-rinkeby'
};

const GQL_QUERY = {
  question: {
    __args: {
      id: undefined
    },
    id: true,
    title: true,
    conditions: {
      id: true,
      fixedProductMarketMakers: {
        id: true,
        collateralToken: true,
        outcomeTokenAmounts: true,
        outcomeTokenMarginalPrices: true
      }
    }
  }
};

export default class Plugin {
  public author = 'David';
  public version = '0.0.1';
  public name = 'Gnosis Impact';
  public website = 'https://gnosis.io';
  public options: any;

  async getPriceImpact(
    network,
    proposalOptions,
  ) {
    try {
      const query = GQL_QUERY;
      query.question.__args.id = proposalOptions.questionId;
      const result = await subgraphRequest(OMEN_SUBGRAPH_URL[network], query);
      return result;
    } catch (e) {
      console.error(e);
    }
  }
}
