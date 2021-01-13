# Contract call strategy

Allows the tokens staked in chef contracts to be used to calculate voter scores. In the JSON, weights can be specified

## Usage:

const example = require('../src/strategies/stablexswap/examples.json')[0];

const scores = await snapshot.strategies.stablexswap(
    'stablexswap',
    example.network,
    new JsonRpcProvider(networks[example.network].rpc[0]),
    example.addresses,
    example,
    example.snapshot
  );

## Testing

To test locally in this repo, we need to add Object.fromEntries:

npm i -D polyfill-object.fromentries

Then add require('polyfill-object.fromentries') in test/index.ts
