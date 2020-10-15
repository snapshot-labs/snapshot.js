# Contract call strategy

Allows the tokens staked in chef conttracts to be used to calculate voter scores.

## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
{
  "strategies": [
    ["pancake", {
      "address": "0x009cF7bC57584b7998236eff51b98A168DceA9B0",
      "chefAddresses": [
        "0xAfd61Dc94f11A70Ae110dC0E0F2061Af5633061A",
        "0x6ab8463a4185b80905e05a9ff80a2d6b714b9e95"
      ],
      "decimals": 18
    }]
  ]
}
```
