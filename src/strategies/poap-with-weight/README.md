# POAP (erc721) tokenid with weight

Each POAP is implemented as an erc721 with a max supply tokens.

This strategy weights the vote with a specific ERC721 NFT with a given TokenId according to the holdings of each POAP and relative scarcity of each NFT.

Here is an example of parameters:

```json
{
  "address": "0x22C1f6050E56d2876009903609a2cC3fEf83B415",
  "symbol": "POAP",
  "ids": ["613607", "613237"]
}
```