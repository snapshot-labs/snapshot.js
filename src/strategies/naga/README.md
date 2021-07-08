# Contract call strategy

Allows the tokens staked in chef contracts to be used to calculate voter scores.

## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
{
  "strategies": [
    ["naga", {
      "address": "0x0FE0E4D99CcA12124dC6FEa9F813aAD7FC3a65d0", //NagaBar
      "chefAddresses": [
          {
            "address": "0x957f415d68b3E50aD6Ad9D30ACF0044E748e1471", //NagaVoterProxy
            "decimals": 6
          }
      ]
    }]
  ]
}
```
