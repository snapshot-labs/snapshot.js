import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import pkg from '../../../package.json';

// viem must only load when getViemClient is actually used — a bare viem
// import reachable from the entry point makes every consumer pay its
// initialization cost at require() time
describe('package entry points', () => {
  const entries = [
    { name: 'cjs', file: pkg.main },
    { name: 'esm', file: pkg.module }
  ];

  entries.forEach(({ name, file }) => {
    const path = join(__dirname, '../../..', file);
    const testIfBuilt = existsSync(path) ? test : test.skip;

    testIfBuilt(`${name} entry does not eagerly load viem`, () => {
      const content = readFileSync(path, 'utf8');
      expect(content).not.toMatch(/require\(['"]viem['"]\)/);
      expect(content).not.toMatch(/(?:^|[\s;])import\s+['"]viem['"]/);
      expect(content).not.toMatch(/from\s+['"]viem['"]/);
    });
  });
});
