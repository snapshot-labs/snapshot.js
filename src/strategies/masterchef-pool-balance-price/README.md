# Generic masterchef pool balance or price strategy

## Description

This strategy gets the balance or price of any combination of tokens for a pool using a masterchef contract.

It allows to get the balance or price of any of the pool pair tokens separately or the combination of both.

Optionally, an anti-whale measure can be applied to reduce the impact of big wallets in the the resulting value.

The price is sourced from CoinGecko.

## Accepted options

- **chefAddress:** masterchef contract address
  
- **pid:** mastechef pool id (starting with zero)

- **uniPairAddress:** Address of a uniswap pair (or a sushi pair or any other with the same interface)
  - If the uniPairAddress option is provided, converts staked LP token balance to base token balance (based on the pair total supply and base token reserve)

  - If uniPairAddress is null or undefined, returns staked token balance of the pool

- **tokenAddress**: Address of a token for single token Pools.
  - If the uniPairAddress is provided the tokenAddress is ignored.

- **weight:** Integer multiplier of the result (for combining strategies with different weights, totally optional)

- **weightDecimals:** Integer value of number of decimal places to apply to the final result

- **token0.address:** Address of the uniPair token 0. If defined, the strategy will return the result for the token0.
  - can be used in conjunction with token1Address to get the sum of tokens or the UniPair token price when used with usePrice and token1Address.

  - Can be used with usePrice to get the price value of the staked amount of token0

- **token0.weight:** Integer multiplier of the result for token0

- **token0.weightDecimals:** Integer value of number of decimal places to apply to the result of token0

- **token1.address:** Address of the uniPair token 1. If defined, the strategy will return the result for the token1.
  - can be used in conjunction with token0Address to get the sum of tokens or the UniPair token price

  - when used with usePrice and token0Address.

  - can be used with usePrice to get the price value of the staked amount of token1.

- **token1.weight:** Integer multiplier of the result for token1.

- **token1.weightDecimal:** Integer value of number of decimal places to apply to the result of token1

- **usePrice:** Boolean flag return the result in usd instead of token count

- **currency:** currency for the price. (defaulted to `usd`).

- **log:** Boolean flag to enable or disable logging to the console (used for debugging purposes during development)

- **antiWhale.enable:** Boolean flag to apply an anti-whale measure reducing the effect on the voting power as the token amount increases.
  - if enabled will apply the the following to the result:
  
      ```none
      If result > antiWhale.threshold
        result = antiWhale.inflectionPoint * ( result / antiWhale.inflectionPoint ) ^ antiWhale.exponent
  
      If result <= antiWhale.threshold {
        thresholdMultiplier = ( antiWhale.inflectionPoint * ( antiWhale.threshold / antiWhale.inflectionPoint )^antiWhale.exponent ) / antiWhale.threshold

        result = result * thresholdMultiplier
      }
      ```

    - **thresholdMultiplier:** The multiplier at which all results below threshold are multiplied. This is ratio of antiWhale/result at the threshold point.

- **antiWhale.threshold:** Point at which antiWhale effect no longer applies. Results less than this will be treated with a static multiplier. This is to reduce infinite incentive for multiple wallet exploits.
  - default: 1625.

  - lower cap: > 0 - set to default if <= 0.

- **antiWhale.inflectionPoint:** Point at which output matches result. Results less than this increase output. Results greater than this decrease output.
  - default: 6500.

  - lower cap: > 0 - set to default if <= 0.

  - must be >= antiWhale.threshold. Otherwise will be same as antiWhale.threshold.

- **antiWhale.exponent:** The exponent is responsible for the antiWhale effect. Must be less than one, or else it will have a pro-whale effect. Must be greater than zero, or else it will cause total voting power to trend to zero.
  - default: 0.5.

  - upper cap: 1.

  - lower cap: > 0 - set to default if <= 0.
  
## Examples

```json
[
  {
    "name": "Example query - Count of tokens in single token Pool",
    "strategy": {
      "name": "masterchef-pool-balance-price",
      "params": {
        "chefAddress": "0x8bE82Ab9B6179bE6EB88431E3E4E0fd93b9E607C",
        "tokenAddress": "0x72572ccf5208b59f4bcc14e6653d8c31cd1fc5a0",
        "pid": "3",
        "weight": 1,
        "weightDecimals": 0,
        "decimals": 0
      }
    },
    "network": "137",
    "addresses": [
      "0x4f9c817035Ac15A3c4C17FD3b60fabE9a4A8EEEF"
    ],
    "snapshot": 17368223
  },
  {
    "name": "Example query - Price of tokens in single token Pool",
    "strategy": {
      "name": "masterchef-pool-balance-price",
      "params": {
        "chefAddress": "0x8bE82Ab9B6179bE6EB88431E3E4E0fd93b9E607C",
        "tokenAddress": "0x72572ccf5208b59f4bcc14e6653d8c31cd1fc5a0",
        "pid": "3",
        "weight": 1,
        "weightDecimals": 0,
        "decimals": 0, 
        "usePrice": true
      }
    },
    "network": "137",
    "addresses": [
      "0x4f9c817035Ac15A3c4C17FD3b60fabE9a4A8EEEF"
    ],
    "snapshot": 17368223
  },
  {
    "name": "Example query - Sum of uniPair token0 and token1 count",
    "strategy": {
      "name": "masterchef-pool-balance-price",
      "params": {
        "chefAddress": "0x8bE82Ab9B6179bE6EB88431E3E4E0fd93b9E607C",
        "uniPairAddress": "0x668269d6E5D2c2dE31D132Ac218044211643622B",
        "token0": {
          "address": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
          "weight": 1,
          "weightDecimals": 0
        },
        "token1": {
          "address": "0x72572ccf5208b59f4bcc14e6653d8c31cd1fc5a0",
          "weight": 1,
          "weightDecimals": 0
        },
        "pid": "0",
        "weight": 1,
        "weightDecimals": 0
      }
    },
    "network": "137",
    "addresses": [
      "0x4f9c817035Ac15A3c4C17FD3b60fabE9a4A8EEEF"
    ],
    "snapshot": 16828978
  },
  {
    "name": "Example query - Sum of uniPair token0 and token1 count",
    "strategy": {
      "name": "masterchef-pool-balance-price",
      "params": {
        "chefAddress": "0x8bE82Ab9B6179bE6EB88431E3E4E0fd93b9E607C",
        "uniPairAddress": "0x668269d6E5D2c2dE31D132Ac218044211643622B",
        "token0": {
          "address": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
          "weight": 1,
          "weightDecimals": 0
        },
        "token1": {
          "address": "0x72572ccf5208b59f4bcc14e6653d8c31cd1fc5a0",
          "weight": 1,
          "weightDecimals": 0
        },
        "pid": "0",
        "weight": 1,
        "weightDecimals": 0
      }
    },
    "network": "137",
    "addresses": [
      "0x4f9c817035Ac15A3c4C17FD3b60fabE9a4A8EEEF"
    ],
    "snapshot": 16828978
  },
  {
    "name": "Example query - uniPair token count",
    "strategy": {
      "name": "masterchef-pool-balance-price",
      "params": {
        "chefAddress": "0x8bE82Ab9B6179bE6EB88431E3E4E0fd93b9E607C",
        "uniPairAddress": "0x668269d6E5D2c2dE31D132Ac218044211643622B",
        "pid": "0",
        "weight": 1,
        "weightDecimals": 0
      }
    },
    "network": "137",
    "addresses": [
      "0x4f9c817035Ac15A3c4C17FD3b60fabE9a4A8EEEF"
    ],
    "snapshot": 16828978
  },
  {
    "name": "Example query - uniPair token price",
    "strategy": {
      "name": "masterchef-pool-balance-price",
      "params": {
        "chefAddress": "0x8bE82Ab9B6179bE6EB88431E3E4E0fd93b9E607C",
        "uniPairAddress": "0x668269d6E5D2c2dE31D132Ac218044211643622B",
        "token0": {
          "address": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
          "weight": 1,
          "weightDecimals": 0
        },
        "token1": {
          "address": "0x72572ccf5208b59f4bcc14e6653d8c31cd1fc5a0",
          "weight": 1,
          "weightDecimals": 0
        },
        "pid": "0",
        "weight": 1,
        "weightDecimals": 0,
        "usePrice": true
      }
    },
    "network": "137",
    "addresses": [
      "0x4f9c817035Ac15A3c4C17FD3b60fabE9a4A8EEEF"
    ],
    "snapshot": 16828978
  },
  {
    "name": "Example query - uniPair token0 count",
    "strategy": {
      "name": "masterchef-pool-balance-price",
      "params": {
        "chefAddress": "0x8bE82Ab9B6179bE6EB88431E3E4E0fd93b9E607C",
        "uniPairAddress": "0x668269d6E5D2c2dE31D132Ac218044211643622B",
        "token0": {
          "address": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
          "weight": 1,
          "weightDecimals": 0
        },
        "pid": "0",
        "weight": 1,
        "weightDecimals": 0
      }
    },
    "network": "137",
    "addresses": [
      "0x4f9c817035Ac15A3c4C17FD3b60fabE9a4A8EEEF"
    ],
    "snapshot": 16828978
  },
  {
    "name": "Example query - uniPair token0 price",
    "strategy": {
      "name": "masterchef-pool-balance-price",
      "params": {
        "chefAddress": "0x8bE82Ab9B6179bE6EB88431E3E4E0fd93b9E607C",
        "uniPairAddress": "0x668269d6E5D2c2dE31D132Ac218044211643622B",
        "token0": {
          "address": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
          "weight": 1,
          "weightDecimals": 0
        },
        "pid": "0",
        "weight": 1,
        "weightDecimals": 0,
        "usePrice": true
      }
    },
    "network": "137",
    "addresses": [
      "0x4f9c817035Ac15A3c4C17FD3b60fabE9a4A8EEEF"
    ],
    "snapshot": 16828978
  },
  {
    "name": "Example query - uniPair token1 count",
    "strategy": {
      "name": "masterchef-pool-balance-price",
      "params": {
        "chefAddress": "0x8bE82Ab9B6179bE6EB88431E3E4E0fd93b9E607C",
        "uniPairAddress": "0x668269d6E5D2c2dE31D132Ac218044211643622B",
        "token1": {
          "address": "0x72572ccf5208b59f4bcc14e6653d8c31cd1fc5a0",
          "weight": 1,
          "weightDecimals": 0
        },
        "pid": "0",
        "weight": 1,
        "weightDecimals": 0
      }
    },
    "network": "137",
    "addresses": [
      "0x4f9c817035Ac15A3c4C17FD3b60fabE9a4A8EEEF"
    ],
    "snapshot": 16828978
  },
  {
    "name": "Example query - uniPair token1 price",
    "strategy": {
      "name": "masterchef-pool-balance-price",
      "params": {
        "chefAddress": "0x8bE82Ab9B6179bE6EB88431E3E4E0fd93b9E607C",
        "uniPairAddress": "0x668269d6E5D2c2dE31D132Ac218044211643622B",
        "token1": {
          "address": "0x72572ccf5208b59f4bcc14e6653d8c31cd1fc5a0",
          "weight": 1,
          "weightDecimals": 0
        },
        "pid": "0",
        "weight": 1,
        "weightDecimals": 0,
        "usePrice": true
      }
    },
    "network": "137",
    "addresses": [
      "0x4f9c817035Ac15A3c4C17FD3b60fabE9a4A8EEEF"
    ],
    "snapshot": 16828978
  },
  {
    "name": "Example query - uniPair token price with anti-whale measure",
    "strategy": {
      "name": "masterchef-pool-balance-price",
      "params": {
        "chefAddress": "0x8bE82Ab9B6179bE6EB88431E3E4E0fd93b9E607C",
        "uniPairAddress": "0xd4689694e9928564647ad483c075f271419b2a5f",
        "token0": {
          "address": "0x16eccfdbb4ee1a85a33f3a9b21175cd7ae753db4",
          "weight": 1,
          "weightDecimals": 0
        },
        "token1": {
          "address": "0x72572ccf5208b59f4bcc14e6653d8c31cd1fc5a0",
          "weight": 1,
          "weightDecimals": 0
        },
        "pid": "12",
        "weight": 1,
        "weightDecimals": 0,
        "usePrice": true,
        "currency": "eur",
        "antiWhale": {
          "enable": true,
          "inflectionPoint": 1000,
          "threshold": 250,
          "exponent": 0.5
        }
      }
    },
    "network": "137",
    "addresses": [
      "0x4f9c817035Ac15A3c4C17FD3b60fabE9a4A8EEEF"
    ],
    "snapshot": 16828978
  }
]
```
