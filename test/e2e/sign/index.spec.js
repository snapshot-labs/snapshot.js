import { describe, test, expect } from 'vitest';
import { Wallet } from '@ethersproject/wallet';
import Client from '../../../src/sign/';

describe('Client', () => {
  describe('send()', () => {
    describe('on success', () => {
      test('should return a JSON-RPC object', async () => {
        expect.assertions(5);
        const client = new Client();
        const pk =
          'f5c1c920babf354b83c9ab1634a10ff50a2835715482b36f181319a109c30921';
        const wallet = new Wallet(pk);
        const address = wallet.address;
        const types = {
          Follow: [
            { name: 'from', type: 'address' },
            { name: 'space', type: 'string' }
          ]
        };
        const domain = { name: 'snapshot', version: '0.1.4' };
        const message = {
          from: address,
          space: 'fabien.eth',
          timestamp: Math.floor(Date.now() / 1000)
        };
        const sig = await wallet._signTypedData(domain, types, message);

        const result = await client.send({
          address,
          sig,
          data: {
            domain,
            types,
            message
          }
        });

        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('ipfs');
        expect(result).toHaveProperty('relayer');
        expect(result).not.toHaveProperty('error');
        expect(result).not.toHaveProperty('error_description');
      });
    });

    describe('on error', () => {
      const payload = { address: '', sig: '', data: '' };

      test('should return the JSON-RPC error from sequencer', async () => {
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
      ])('should throw an error on network error (%s)', async (code, url) => {
        expect.assertions(1);
        const client = new Client(url);
        await expect(() => client.send(payload)).rejects.toThrowError(code);
      });

      test('should throw an error on network error (timeout)', async () => {
        expect.assertions(1);
        const client = new Client('https://httpstat.us/200?sleep=5000', {
          timeout: 500
        });
        await expect(() => client.send(payload)).rejects.toThrowError(
          'aborted'
        );
      });
    });
  });
});
