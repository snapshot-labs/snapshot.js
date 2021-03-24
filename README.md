# Snapshot.js

### Install
Snapshot.js was designed to work both in the browser and in Node.js.

#### Node.js
To install Snapshot.js on Node.js, open your terminal and run:
```
npm i @snapshot-labs/snapshot.js
```

#### Browser
You can create an index.html file and include Snapshot.js with:
```html
<script src="https://cdn.jsdelivr.net/npm/@snapshot-labs/snapshot.js"></script>
```

#### Tests
If you want to test the strategy you are changing, try running

`npm run test` // Tests default (erc20-balance-of)
`npm run test --strategy=erc20-received`
`npm run test --strategy=eth-balance`
`npm run test --strategy=all` (to run all strategies)

### License
[MIT](LICENSE).
