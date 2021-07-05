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
### Development

#### Install dependencies
```bash
npm install
```

#### Build package
```bash
npm run build
```

#### Test strategy
```bash
# Test default strategy (erc20-balance-of)
npm run test
# Test strategy with name
npm run test --strategy=erc20-received
npm run test --strategy=eth-balance
# Test with more addresses from addresses.json
npm run test --strategy=eth-balance --more=200 
```

### License
[MIT](LICENSE).
