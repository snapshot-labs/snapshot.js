import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    // e2e specs resolve names over live RPC and CCIP gateways: measured 2-4s per
    // case, so the 5s default fails on contention alone
    testTimeout: 20000,
    coverage: { all: true }
  }
});
