# Contract call strategy

Scores addresses by how much ERC20 token they have sent to `params.receivingAddresses`, adding `params.coeff` tokens to their score for every 1 token sent. 

This creates a new fundraising opportunity for projects & organizations, levels the playing field for less wealthy participants, and encourages voters to "put their money where their mouth is".

## Params

- `contractAddress` - (**Required**, `string`) Address of ERC20 token contract
- `decimals` - (**Required**, `number`) Decimal precision for ERC20 token
- `receivingAddresses` - (**Required**, `string[]`) Array of addresses to check for ERC20 transactions from voters
- `coeff` - (**Optional**, `number`, Default: `1`) Amount to multiply the sum of a voter's ERC20 sent to `receivingAddresses`. When used in conjunction with other strategies, this enables the increase or decrease of leverage given to voter who send tokens.
- `dfuseApiKey` - (**Optional**, `string`, Default: contributor's test key) - Customize Dfuse API key


## Examples

Can be used instead of, or in conjunction with erc20-balance-of strategy. 
In this example, the `params.coeff` of `100` makes a 1 token donation equivalent to a balance of 100 tokens. Thus, giving voters a massive incentive to donate.

The space config will look like this:

```JSON
"strategies": [
  {
    "name": "Example ERC20-Received Strategy",
    "strategy": {
      "name": "erc20-received",
      "params": {
        "coeff": 100,
        "decimals": 18,
        "contractAddress": "0x6b175474e89094c44da98b954eedeac495271d0f",
        "receivingAddresses": [
          "0x65689471339798e1dae0d2ffb61073bf4e3765e4",
          "0x42b5d4a11c8fe76d114759f7f3d8e94ea28bdbe5",
          "0xcad6f7e74a34a5adf550e30b1e397d2c82bb1b1c",
          "0x95b2271039b020aba31b933039e042b60b063800"
        ]
      }
    },
    "network": "1",
    "addresses": [
      "0x062d413463fc6b5c4a096cb1cebae77c6d834222",
      "0xca00e2502f713ebf5e58bbb21930594af6988a4c",
      "0xb83074760468be269e4dc834862525f8daf6626a",
      "0x88fb0e1c8367af92d90b534888c789233360e53d"
    ],
    "snapshot": 11414195
  },
  {
    "name": "Example ERC20-Balance Strategy",
    "strategy": {
      "name": "erc20-balance",
      "params": {
        "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
        "decimals": 18
      }
    },
    "network": "1",
    "addresses": [
      "0x062d413463fc6b5c4a096cb1cebae77c6d834222",
      "0xca00e2502f713ebf5e58bbb21930594af6988a4c",
      "0xb83074760468be269e4dc834862525f8daf6626a",
      "0x88fb0e1c8367af92d90b534888c789233360e53d"
    ],
    "snapshot": 11414195
  }
]
```

Valid test addresses and snapshot block number:
```typescript
const addresses = [
  "0x062d413463fc6b5c4a096cb1cebae77c6d834222",
  "0xca00e2502f713ebf5e58bbb21930594af6988a4c",
  "0xb83074760468be269e4dc834862525f8daf6626a",
  "0x88fb0e1c8367af92d90b534888c789233360e53d"
];

const snapshot = 11414195;
```
