import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import pkg from '../../../package.json';

// ENS resolution routes through viem (Universal Resolver + CCIP-Read), so
// the entry points now import it eagerly — a deliberate trade-off made with
// the ENS v2 support; consumers pay viem's initialization cost at require()
describe('package entry points', () => {
  const entries = [
    { name: 'cjs', file: pkg.main },
    { name: 'esm', file: pkg.module }
  ];

  entries.forEach(({ name, file }) => {
    const path = join(__dirname, '../../..', file);
    const testIfBuilt = existsSync(path) ? test : test.skip;

    testIfBuilt(`${name} entry keeps viem as an external import`, () => {
      const content = readFileSync(path, 'utf8');
      expect(content).toMatch(/require\(['"]viem['"]\)|from\s+['"]viem['"]/);
    });
  });
});
