# Snapshot.js

[![npm](https://img.shields.io/npm/v/@snapshot-labs/snapshot.js?label=npm)](https://www.npmjs.com/package/@snapshot-labs/snapshot.js)

## Install

Snapshot.js was designed to work both in the browser and in Node.js.

### In Node Applications

To install Snapshot.js on Node.js, open your terminal and run:

```bash
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
yarn
```

#### Build package

```bash
yarn build
```

#### Test cases

```bash
yarn test
# or
yarn test:once
```

#### Other useful scripts

```bash
# Format ABI
ts-node scripts/abi.ts
# Generate hash for types
ts-node scripts/generateHashWithTypes.ts
```

### License

[MIT](LICENSE).
