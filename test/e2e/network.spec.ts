import networks from '../../src/networks.json';
import { test, expect, describe } from 'vitest';

describe('test networks.json file', () => {
  test('explorer endpoint should not end with a /', () => {
    expect(
      Object.values(networks).every(
        (network) => !network.explorer.url.endsWith('/')
      )
    ).toBe(true);
  });
});
