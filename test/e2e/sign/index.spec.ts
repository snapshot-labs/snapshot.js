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

    it('initializes correctly with given parameters', () => {});

    describe('Address Assignment', () => {
      it('assigns address to this.address when envelop.sig is not "0x" or relayerURL is not provided', () => {});
      it('assigns address to this.options.relayerURL when envelop.sig is "0x" and relayerURL is provided', () => {});
    });

    describe('Fetch Call', () => {
      it('calls fetch with correct address and init parameters', () => {});
      it('returns correctly when fetch call is successful', () => {});
      it('throws an error when fetch call fails', () => {});
    });

    describe('Error Handling', () => {
      it('throws sequencer error when error object has both error and error_description properties', () => {});
      it('throws non-sequencer error when error object does not have both error and error_description properties', () => {});
    });
  });
});
