# Contract call strategy

Allows to count votes based on if a user has more than or equal to 10 tokens. If it has, then each user with that threshold has 1 vote only, regardless of how many more tokens they might hold.

## Params

- `minTokenBalance` - Minimum amount of tokens to have for vote to be counted as 1.

## Examples

Example below: 
```JSON
[
    {
      "name": "DIAData example",
      "strategy": {
        "name": "diadata",
        "params": {
          "address": "0x84cA8bc7997272c7CfB4D0Cd3D55cd942B3c9419",
          "symbol": "DIA",
          "decimals": 18,
          "minTokenBalance": 10
        }
      },
      "network": "1",
      "addresses": [
        "0x0000000000000000000000000000000000baddad",
        "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11",
        "0xeF8305E140ac520225DAf050e2f71d5fBcC543e7",
        "0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1",
        "0xBA2E7Fed597fd0E3e70f5130BcDbbFE06bB94fe1",
        "0x4C7909d6F029b3a5798143C843F4f8e5341a3473",
        "0x84cA8bc7997272c7CfB4D0Cd3D55cd942B3c9419",
        "0x72ac1760daf52986421b1552bdca04707e78950e"
      ],
      "snapshot": 11184248
    }
  ]
```
