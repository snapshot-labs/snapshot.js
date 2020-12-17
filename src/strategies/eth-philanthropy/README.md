# Contract call strategy

  Allows addresses to increase their ETH balance-based score by donating to charity, adding 100 ETH to their score for every 1 ETH donated. This helps to level the playing field for less wealthy participants and incentivizes altruistic behavior from all participants.

## Params

None


## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
"strategies": [
  {
    "name": "Example ETH Philanthropy Query",
    "strategy": {
      "name": "eth-philanthropy",
      "params": {}
    },
    "network": "1",
    "addresses": [
      "0x100fb703c8b84466f79e838835df6fc180aef740",
      "0xbcB5f94590904A64e16Acb08D4Fa4b7baFdC8c3A",
      "0x0a0249179f559f60496e23e3907e9a3a54aa6537",
      "0x6c65fb326e7734ba5508b5d043718288b43b9ed9",
      "0x1E1A51E25f2816335cA436D65e9Af7694BE232ad",
      "0x1F717Ce8ff07597ee7c408b5623dF40AaAf1787C",
      "0x1c7a9275F2BD5a260A9c31069F77d53473b8ae2e"
    ],
    "snapshot": 11414195
  }
]
```

Valid test addresses and snapshot block number:
```typescript
const addresses = [
  "0x100fb703c8b84466f79e838835df6fc180aef740",
  "0xbcB5f94590904A64e16Acb08D4Fa4b7baFdC8c3A",
  "0x0a0249179f559f60496e23e3907e9a3a54aa6537",
  "0x6c65fb326e7734ba5508b5d043718288b43b9ed9",
  "0x1E1A51E25f2816335cA436D65e9Af7694BE232ad",
  "0x1F717Ce8ff07597ee7c408b5623dF40AaAf1787C",
  "0x1c7a9275F2BD5a260A9c31069F77d53473b8ae2e"
];

const snapshot = 11414195;
```
