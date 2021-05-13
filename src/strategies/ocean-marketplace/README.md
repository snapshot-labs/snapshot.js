# Ocean marketplace Snapshot strategy

```version 0.1```

This strategy gives score aka votes to the liquidity providers on the [Ocean marketplace](https://market.oceanprotocol.com). This means that they can vote for OceanDAO votes hosted on the Snapshot platform without the need to remove their liquidity.

## Solution description

The solution pulls the needed data from the Ocean Protocol mainnet subgraph endpoint:
```https://subgraph.mainnet.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph```

It is pulling a bit more information than currently used so the solution can also be extended. The current limitation comes from only considering liquidity providers and ignoring pure token holders. This means that the tokens added to the liquidity pool by the pure token holders are accredited to the liquidity providers. This can be fixed but is a bit more complicated as the ratio of datatokens to Ocean tokens has to be considered in a general manner. And the token holders for each pool have to be extracted from the subgraph.

So the current solution checks for active pools with participants and then attributes votes to them like this:
```
user_votes = user_pool_shares * (total_Ocean_in_the_pool / total_number_of_pool_shares)
```
This is done for all pools and the votes for the users are added up.

To extend or run this strategy please use the setup described [here](https://docs.snapshot.page/strategies).

## GraphQL queries:

### Pools

```
pools (first: 1000, orderBy: oceanReserve, orderDirection: desc) {
  id,
  holderCount,
  oceanReserve,
  active,
  totalShares,
  shares (first: 1000) {
    id,
    userAddress {
      id,
      tokensOwned {
        id
      }
    },
    balance
  },
  tokens {
    balance,
    denormWeight,
    tokenId {
      id
    }
  }
}
```

### Datatokens

```
{
datatokens {
  id,
  balances {
    userAddress {
      id
    }
    balance
  }
}
}
```