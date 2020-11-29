# stablexswap Snapshot Strategy

Allows the tokens staked in chef contracts to be used to calculate voter scores.

## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:
0x25 is the 1 Year Staking pool

```JSON
{
  "strategies": [
    ["STAX", {
      "address": "0x0da6ed8b13214ff28e9ca979dd37439e8a88f6c4",
      "staxAddresses": [
        "0x252B23B524F8a93506c02ff355780Ced62EA4004"
      ],
      "decimals": 18
    }]
  ]
}
```
