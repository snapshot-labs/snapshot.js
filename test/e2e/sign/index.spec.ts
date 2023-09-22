import { describe, test, expect } from 'vitest';
import Client from '../../../src/sign/';

describe('Client', () => {
  describe('send()', () => {
    describe('on error', () => {
      const payload = { address: '', sig: '', data: '' };

      test('should return the error from sequencer as a Promise rejection', async () => {
        expect.assertions(1);
        const client = new Client();
        await expect(client.send(payload)).to.rejects.toEqual({
          error: 'client_error',
          error_description: 'wrong envelope format'
        });
      });

      test.each([
        ['ENOTFOUND', 'https://unknown.snapshot.org'],
        ['404 Not Found', 'https://httpstat.us/404']
      ])(
        'should return the network error (%s) as Promise rejection',
        async (code, url) => {
          expect.assertions(1);
          const client = new Client(url);
          await expect(() => client.send(payload)).rejects.toThrowError(code);
        }
      );
    });
  });
});
