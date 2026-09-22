import { afterEach, describe, expect, test, vi } from 'vitest';
import crossFetch from 'cross-fetch';
import { getScores, getVp, validate } from '../../../src/utils';

vi.mock('cross-fetch', () => ({ default: vi.fn() }));

const ADDRESS = '0xD50D0f41dd217a0966dca6383E734f409cBC1A94';
const STRATEGIES = [{ name: 'erc20-balance-of', params: {} }];

const CLOUDFLARE_522 = {
  title: 'Error 522: Connection timed out',
  status: 522,
  error_code: 522,
  cloudflare_error: true
};

function respond(body: unknown, status = 200) {
  vi.mocked(crossFetch).mockResolvedValue(
    new Response(JSON.stringify(body), { status })
  );
}

describe('score API response parsing', () => {
  afterEach(() => vi.mocked(crossFetch).mockReset());

  test('getVp rejects with status and body on a non-2xx JSON body without result', async () => {
    respond(CLOUDFLARE_522, 522);

    await expect(
      getVp(ADDRESS, '1', STRATEGIES, 'latest', 'test.eth', false)
    ).rejects.toEqual({
      code: 522,
      message: 'Invalid response from score API',
      data: CLOUDFLARE_522
    });
  });

  test('getScores rejects on a 2xx JSON body without result', async () => {
    respond({ jsonrpc: '2.0', id: 1 });

    await expect(
      getScores('test.eth', STRATEGIES, '1', [ADDRESS])
    ).rejects.toMatchObject({
      code: 500,
      message: 'Invalid response from score API'
    });
  });

  test('validate still resolves a false result', async () => {
    respond({ jsonrpc: '2.0', result: false, id: 1 });

    await expect(
      validate('basic', ADDRESS, 'test.eth', '1', 'latest', {})
    ).resolves.toBe(false);
  });
});
