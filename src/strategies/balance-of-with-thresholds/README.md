# balance-of-with-thresholds

This strategy return the balances of the voters for a specific ERC20 or ERC721 and maps them to the number of votes that voter gets based on a table of minimum thresholds.

Here is an example of parameters:

```json
{
  "address": "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d",
  "symbol": "LAND",
  "decimals": 0,
  "thresholds": [
    { "threshold": 1, "votes": 1 },
    { "threshold": 4, "votes": 2 },
    { "threshold": 11, "votes": 3 },
    { "threshold": 25, "votes": 4 }
  ]
}
```
