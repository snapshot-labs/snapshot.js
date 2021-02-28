# Contract call strategy

This strategy checks the amount of LP tokens staked and calculates the amount of DITTO associated with the stake. voting rights are the same for those who stake 1 DITTO and for those holding 1 DITTO

## Params

**Pancake** :[0x470BC451810B312BBb1256f96B0895D95eA659B1](https://bscscan.com/address/0x470BC451810B312BBb1256f96B0895D95eA659B1)

**sharePool**: [0x27Da7Bc5CcB7c31baaeEA8a04CC8Bf0085017208](https://bscscan.com/address/0x27Da7Bc5CcB7c31baaeEA8a04CC8Bf0085017208)

**Token[Ditto]**: [0x233d91a0713155003fc4dce0afa871b508b3b715](https://bscscan.com/address/0x233d91a0713155003fc4dce0afa871b508b3b715)

## Examples

```json
[
  {
    "name": "Ditto.money",
    "strategy": {
      "name": "dittomoney",
      "params": {
        "pancake": "0x470BC451810B312BBb1256f96B0895D95eA659B1",
        "sharePool": "0x27Da7Bc5CcB7c31baaeEA8a04CC8Bf0085017208",
        "token": "0x233d91a0713155003fc4dce0afa871b508b3b715",
        "decimals": 18,
        "minBalance": 1
      }
    },
    "network": "56",
    "addresses": [
    ],
    "snapshot": 11605878
  }
]
```
