import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ContractFunctionRevertedError } from 'viem';
import { getEnsTextRecord, getEnsOwner } from './ens';
import { getViemClient } from './viem';

vi.mock('./viem', () => ({ getViemClient: vi.fn() }));

const UR = '0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe';
const EMPTY = '0x0000000000000000000000000000000000000000';
const OWNER = '0x1208a26FAa0F4AC65B42098419EB4dAA5e580AC6';
const NOT_IMPLEMENTED = '0xd6234725';

// an error viem raises for a Universal Resolver revert: a wrapper whose
// walk() surfaces a ContractFunctionRevertedError carrying the decoded name
function revertError(errorName: string, arg?: any) {
  const revert = Object.create(ContractFunctionRevertedError.prototype);
  revert.data = { errorName, args: arg === undefined ? [] : [arg] };
  return { walk: (fn: any) => (fn(revert) ? revert : undefined) };
}
// a revert viem could not decode: a ContractFunctionRevertedError with no
// errorName — how deployments predating findOwner (e.g. mainnet) revert
function undecodedRevert() {
  const revert = Object.create(ContractFunctionRevertedError.prototype);
  revert.data = undefined;
  return { walk: (fn: any) => (fn(revert) ? revert : undefined) };
}
// a non-revert failure (transport/RPC): walk finds no revert
const transportError = { walk: () => undefined };

function mockClient(overrides: Record<string, any> = {}) {
  const client = {
    getEnsText: vi.fn(),
    getEnsAddress: vi.fn(),
    readContract: vi.fn(),
    ...overrides
  };
  vi.mocked(getViemClient).mockReturnValue(client as any);
  return client;
}

beforeEach(() => vi.mocked(getViemClient).mockReset());

describe('getEnsTextRecord fail-closed classification', () => {
  const opts = { ensUniversalResolver: UR };

  test.each([
    ['ResolverNotFound', undefined],
    ['ResolverNotContract', undefined],
    ['UnsupportedResolverProfile', undefined],
    ['ResolverError with empty data', '0x'],
    ['ResolverError NotImplemented (DNS names)', NOT_IMPLEMENTED],
    ['HttpError 404', 404]
  ])('returns null for %s', async (name, arg) => {
    const errorName = name.split(' ')[0];
    const client = mockClient();
    client.getEnsText.mockRejectedValue(revertError(errorName, arg));
    await expect(
      getEnsTextRecord('x.eth', 'snapshot', '1', opts)
    ).resolves.toBe(null);
  });

  test.each([
    ['HttpError 503', 'HttpError', 503],
    ['HttpError 500', 'HttpError', 500],
    ['data-carrying ResolverError', 'ResolverError', '0xdeadbeef'],
    ['transport failure', null, null]
  ])('throws for %s', async (_label, errorName, arg) => {
    const client = mockClient();
    client.getEnsText.mockRejectedValue(
      errorName ? revertError(errorName, arg) : transportError
    );
    await expect(
      getEnsTextRecord('x.eth', 'snapshot', '1', opts)
    ).rejects.toBeDefined();
  });
});

describe('getEnsOwner findOwner fallback', () => {
  const opts = { ensUniversalResolver: UR, ensNameWrapper: EMPTY };

  test('returns the findOwner result for a v2 name', async () => {
    const client = mockClient();
    client.readContract.mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner('x.eth', '1', opts)).resolves.toBe(OWNER);
    expect(client.readContract).toHaveBeenCalledTimes(1);
  });

  test('falls back to the registry when findOwner reverts undecoded', async () => {
    // undecoded revert = deployments predating findOwner (e.g. mainnet)
    const client = mockClient();
    client.readContract
      .mockRejectedValueOnce(undecodedRevert())
      .mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner('x.eth', '1', opts)).resolves.toBe(OWNER);
    expect(client.readContract).toHaveBeenCalledTimes(2);
  });

  test('throws when findOwner reverts with a decoded error', async () => {
    const client = mockClient();
    client.readContract.mockRejectedValueOnce(
      revertError('ResolverError', '0xdeadbeef')
    );
    await expect(getEnsOwner('x.eth', '1', opts)).rejects.toBeDefined();
  });

  test('throws when findOwner fails at the transport layer', async () => {
    const client = mockClient();
    client.readContract.mockRejectedValueOnce(transportError);
    await expect(getEnsOwner('x.eth', '1', opts)).rejects.toBeDefined();
  });
});
