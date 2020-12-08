# Contract call strategy

Allows subdomain owners of a ENS domain to vote depending on the number of domains one own


## Params

- `domain` - The name of the parent domain.

## Examples

```JSON
"strategies": [
  {
    "name": "Example query",
    "strategy": {
      "name": "ens-domains-owned",
      "params": {
        "domain": "ismoney.eth"
      }
    },
    "network": "1",
    "addresses": [
      "0xaCf4C2950107eF9b1C37faA1F9a866C8F0da88b9",
      "0x0239769A1aDF4DeF9f07Da824B80B9C4fCB59593"
    ],
    "snapshot": 11414195
  }
]
```

Valid test addresses and snapshot block number:
```typescript
const addresses = [
  '0xaCf4C2950107eF9b1C37faA1F9a866C8F0da88b9'
];

const snapshot = 11414195;
```