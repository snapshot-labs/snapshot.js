# Contract call strategy

Allows for calculating the voting weight of cToken holders. This strategy allows for invalidating borrowers from voting and incorperating a waiting period between minting (or receiving) cTokens and votes becoming availible. 

## Params

- `offsetCheck` - Offset (or waiting period) between minting and voting becoming availible
- `borrowingRestricted` - If true, borrowers will have a 0 voting weight

## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
"strategies": [
    {
      "name": "ctoken",
      "params": {
        "address": "0x35A18000230DA775CAc24873d00Ff85BccdeD550",
        "symbol": "cUNI",
        "decimals": 8,
        "offsetCheck":40320,
        "borrowingRestricted":true
      }
    }
  ]
```
