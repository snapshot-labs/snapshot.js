# Uniswap Token Balance

Calculates how many of token X the user has in a Uniswap X-Y pool.

This can be used in conjuction with e.g. erc20balanceOf, to allow people to vote even if their tokens are currently providing liquidity on Uniswap.

## Example

```JS
{
  "strategies": [
    ["uniswap", {
      address: "0xDf6b861B4FBCFaffb62dD1906fCd3a863955704b",
      tokenAddress: "0x6e36556b3ee5aa28def2a8ec3dae30ec2b208739",
      symbol: "BUILD",
      decimals: 18
    }]
  ]
}
```