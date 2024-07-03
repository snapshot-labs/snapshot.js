import { test, expect, describe } from 'vitest';
import starknetMessage from '../../test/fixtures/starknet/message-alias.json';
import verify from './starknet';

describe('verify/starknet', () => {
  test('should return true if the signature is valid', () => {
    expect(
      verify(starknetMessage.address, starknetMessage.sig, starknetMessage.data)
    ).resolves.toBe(true);
  });

  test('should throw an error if the signature is invalid', () => {
    expect(
      verify(
        '0x7667469b8e93faa642573078b6bf8c790d3a6184b2a1bb39c5c923a732862e1',
        starknetMessage.sig,
        starknetMessage.data
      )
    ).rejects.toThrow();
  });
});
