# Contract call strategy

Allows the tokens staked in chef contracts to be used to calculate voter scores.

## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
{
  "strategies": [
    ["naga", {
      "address": "0x009cF7bC57584b7998236eff51b98A168DceA9B0", //NagaBar
      "chefAddresses": [
          {
            "address": "0xFb1088Dae0f03C5123587d2babb3F307831E6367", //SmartChef
            "decimals": 18
          },
          {
            "address": "0x4086D46A650517fa756F620507dB704D3900Da07", //NagaVoterProxy
            "decimals": 6
          }
      ]
    }]
  ]
}
```
