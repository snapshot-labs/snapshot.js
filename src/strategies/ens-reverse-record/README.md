# Contract call strategy

Allows users with ENS reverse record address to vote

## Params

None

## Examples

```JSON
"strategies": [
  {
    "name": "Example query",
    "strategy": {
      "name": "ens-reverse-record",
    },
    "network": "1",
    "addresses": [
      "0xaCf4C2950107eF9b1C37faA1F9a866C8F0da88b9",
      "0x0239769A1aDF4DeF9f07Da824B80B9C4fCB59593"
    ],
    "snapshot": 12011880
  }
]
```

Valid test addresses and snapshot block number:
```typescript
const addresses = [
  '0xaCf4C2950107eF9b1C37faA1F9a866C8F0da88b9'
];

const snapshot = 12011880;
```