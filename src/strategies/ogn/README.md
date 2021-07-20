# ogn

A strategy for Origin Protocol governance.

The score is based on the amount of OGN held in the wallet and the OGN staking contract.
An average balance is calculated at the specified block number and 30 days prior to that.

Here is an example of parameters:

```json
{
  "ognAddress": "0x8207c1ffc5b6804f6024322ccf34f29c3541ae26",
  "stakingAddress": "0x501804B374EF06fa9C427476147ac09F1551B9A0",
  "symbol": "OGN",
  "decimals": 18
}
```
