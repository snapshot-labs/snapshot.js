# Contract call strategy

Allows the tokens staked in chef contracts to be used to calculate voter scores. In the JSON, weights can be specified

## Usage

To use locally we need to add Object.fromEntries:

"npm i -D polyfill-object.fromentries"

Then add "require('polyfill-object.fromentries')" in test/index.ts and run "npm run test --strategy=stablexswap"
