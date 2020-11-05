# Contract call strategy

Allow the tokens staked in Long-term pools and Cream Swap LP holders to be used to calculate voter scores.

## Params

- `address` - Cream Swap LP include this token count as valid score.
- `pools` - Contracts must have `balanceOf(address)` in the ABI.



## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
"strategies": [
  {
    "name": "cream",
    "params": {
      "address": "0x2ba592F78dB6436527729929AAf6c908497cB200",
      "symbol": "CREAM",
      "pools": [
        {
          "name": "CREAM",
          "address": "0x2ba592F78dB6436527729929AAf6c908497cB200"
        },
        {
          "name": "1 Year",
          "address": "0x780F75ad0B02afeb6039672E6a6CEDe7447a8b45"
        },
        {
          "name": "2 Year",
          "address": "0xBdc3372161dfd0361161e06083eE5D52a9cE7595"
        },
        {
          "name": "3 Year",
          "address": "0xD5586C1804D2e1795f3FBbAfB1FBB9099ee20A6c"
        },
        {
          "name": "4 Year",
          "address": "0xE618C25f580684770f2578FAca31fb7aCB2F5945"
        }
      ]
    }
  }
]
```

Valid test addresses and snapshot block number:
```typescript
const addresses = [
  '0xE6f6f9492098AAd009faA3F9b84F35C0b6eE7F3c',
  '0x197939c1ca20C2b506d6811d8B6CDB3394471074',
  '0xB1FC9a24D40f784e6A5694769792C18af5157Fa6'
];

const snapshot = 11131883;
```
