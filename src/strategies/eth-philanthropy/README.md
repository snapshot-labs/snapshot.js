# Contract call strategy

Enables addresses to increase their score by donating to charity, adding `params.coeff` ETH to their score for every 1 ETH donated. This helps to level the playing field for less wealthy participants and incentivizes altruistic behavior from all participants.

Implementation of [eth-received](./../eth-received)

### Currently Included Charities:
- [GiveDirectly](https://www.givedirectly.org/): 0xc7464dbcA260A8faF033460622B23467Df5AEA42
- [Unsung.org](http://Unsung.org): 0x02a13ED1805624738Cc129370Fee358ea487B0C6
- [Heifer.org](http://Heifer.org): 0xD3F81260a44A1df7A7269CF66Abd9c7e4f8CdcD1
- [GraceAid.org.uk](http://GraceAid.org.uk): 0x236dAA98f115caa9991A3894ae387CDc13eaaD1B
- [SENS.org](http://SENS.org): 0x542EFf118023cfF2821b24156a507a513Fe93539
- [350.org](http://350.org): 0x50990F09d4f0cb864b8e046e7edC749dE410916b
- [EFF.org](http://EFF.org): 0xb189f76323678E094D4996d182A792E52369c005
- [WikiLeaks](http://WikiLeaks.org): 0xE96E2181F6166A37EA4C04F6E6E2bD672D72Acc1
- [GiveWell.org](http://GiveWell.org): 0x7cF2eBb5Ca55A8bd671A020F8BDbAF07f60F26C1
- [CoolEarth.org](http://CoolEarth.org): 0x3c8cB169281196737c493AfFA8F49a9d823bB9c5
- [Run2Rescue.org](http://Run2Rescue.org): 0xd17bcbFa6De9E3741aa43Ed32e64696F6a9FA996
- [Archive.org](http://Archive.org): 0xFA8E3920daF271daB92Be9B87d9998DDd94FEF08
- [Alt.eco](http://alt.eco): 0x5E7ecc1fC819f937fbEe043b40388C0809361ae9

## Params

- `coeff` - (**Optional**, `number`, Default: `100`) Amount to multiply the sum of a voter's ether sent to charity. When used in conjunction with other strategies, this enables the increase or decrease of leverage given to voters who donate.


## Examples

Can be used instead of, or in conjunction with eth-balance strategy. 
In this example, the `params.coeff` of `1000` makes a 1 ETH donation equivalent to a 1000 ETH address balance. Thus, giving voters a massive incentive to donate.

The space config will look like this:

```JSON
"strategies": [
  {
    "name": "Example ETH-Philanthropy Strategy",
    "strategy": {
      "name": "eth-philanthropy",
      "params": {
        "coeff": 1000,
        "receivingAddresses": [
          "0xc7464dbcA260A8faF033460622B23467Df5AEA42",
          "0x02a13ED1805624738Cc129370Fee358ea487B0C6",
          "0xD3F81260a44A1df7A7269CF66Abd9c7e4f8CdcD1",
          "0x236dAA98f115caa9991A3894ae387CDc13eaaD1B",
          "0x542EFf118023cfF2821b24156a507a513Fe93539",
          "0x50990F09d4f0cb864b8e046e7edC749dE410916b",
          "0xb189f76323678E094D4996d182A792E52369c005",
          "0xE96E2181F6166A37EA4C04F6E6E2bD672D72Acc1",
          "0x7cF2eBb5Ca55A8bd671A020F8BDbAF07f60F26C1",
          "0x3c8cB169281196737c493AfFA8F49a9d823bB9c5",
          "0xd17bcbFa6De9E3741aa43Ed32e64696F6a9FA996",
          "0xFA8E3920daF271daB92Be9B87d9998DDd94FEF08",
          "0x5E7ecc1fC819f937fbEe043b40388C0809361ae9"
        ]
      }
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
  },
  {
    "name": "Example ETH-Balance Strategy",
    "strategy": {
      "name": "eth-balance",
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
