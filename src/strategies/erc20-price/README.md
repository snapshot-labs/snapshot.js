# erc20-price

This strategy returns the balances of the voters for a specific ERC20 token multiplied by price of the token. 
Strategy uses coingecko api to fetch the price from particular timestamp of the block

Here is an example of parameters:

```json
{
  "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
  "symbol": "DAI",
  "decimals": 18
}
```

Other Parameters:

`platform` parameter for coingecko api, which can be found [here](https://api.coingecko.com/api/v3/asset_platforms)

 `currency` parameter (defaulted to `usd`) to change the currency of the price