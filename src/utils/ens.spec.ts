import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ContractFunctionRevertedError, toHex } from 'viem';
import { packetToBytes } from 'viem/ens';
import { getEnsTextRecord, getEnsOwner } from './ens';
import { getSpaceController } from '../utils';
import { getViemClient } from './viem';

vi.mock('./viem', () => ({ getViemClient: vi.fn() }));

const EMPTY = '0x0000000000000000000000000000000000000000';
const OWNER = '0x1208a26FAa0F4AC65B42098419EB4dAA5e580AC6';
const NOT_IMPLEMENTED = '0xd6234725';

// viem error shapes: walk() surfaces a ContractFunctionRevertedError with the
// decoded errorName, or without one when the revert cannot be decoded
function revertError(errorName: string, arg?: any) {
  const revert = Object.create(ContractFunctionRevertedError.prototype);
  revert.data = { errorName, args: arg === undefined ? [] : [arg] };
  return { walk: (fn: any) => (fn(revert) ? revert : undefined) };
}
function undecodedRevert() {
  const revert = Object.create(ContractFunctionRevertedError.prototype);
  revert.data = undefined;
  return { walk: (fn: any) => (fn(revert) ? revert : undefined) };
}
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

beforeEach(() => {
  vi.mocked(getViemClient).mockReset();
});

describe('getEnsTextRecord fail-closed classification', () => {
  test('reads in strict mode, so failures are not folded into null', async () => {
    const client = mockClient();
    client.getEnsText.mockResolvedValue('record');
    await getEnsTextRecord('x.eth', 'snapshot', '1');
    expect(client.getEnsText).toHaveBeenCalledWith(
      expect.objectContaining({ strict: true })
    );
  });

  test.each([
    ['ResolverNotFound', undefined],
    ['ResolverNotContract', undefined],
    ['UnsupportedResolverProfile', undefined],
    ['ResolverError NotImplemented (DNS names)', NOT_IMPLEMENTED],
    ['HttpError 404', 404]
  ])('returns null for %s', async (name, arg) => {
    const errorName = name.split(' ')[0];
    const client = mockClient();
    client.getEnsText.mockRejectedValue(revertError(errorName, arg));
    await expect(getEnsTextRecord('x.eth', 'snapshot', '1')).resolves.toBe(
      null
    );
  });

  // how DNS TLD resolvers answer: bare revert on mainnet, UnreachableName
  // on Sepolia
  test.each([
    ['a bare revert', '0x'],
    ['UnreachableName', '0x5fe9a5df0000000000000000000000000000000000000000']
  ])('returns null for %s on a DNS name', async (_label, data) => {
    const client = mockClient();
    client.getEnsText.mockRejectedValue(revertError('ResolverError', data));
    await expect(getEnsTextRecord('x.com', 'snapshot', '1')).resolves.toBe(
      null
    );
  });

  test.each([
    ['HttpError 503', 'HttpError', 503],
    ['HttpError 500', 'HttpError', 500],
    ['ResolverError from a bare revert()', 'ResolverError', '0x'],
    ['data-carrying ResolverError', 'ResolverError', '0xdeadbeef'],
    ['transport failure', null, null]
  ])('throws for %s', async (_label, errorName, arg) => {
    const client = mockClient();
    client.getEnsText.mockRejectedValue(
      errorName ? revertError(errorName, arg) : transportError
    );
    await expect(
      getEnsTextRecord('x.eth', 'snapshot', '1')
    ).rejects.toBeDefined();
  });
});

describe('getSpaceController fail-closed', () => {
  test('rejects when the record read fails instead of falling back to the owner', async () => {
    const client = mockClient();
    client.getEnsText.mockRejectedValue(revertError('HttpError', 503));
    client.readContract.mockResolvedValue(OWNER);
    await expect(getSpaceController('x.eth', '1')).rejects.toBeDefined();
    expect(client.readContract).not.toHaveBeenCalled();
  });

  test('rejects when the resolver reverts bare instead of returning the owner', async () => {
    const client = mockClient();
    client.getEnsText.mockRejectedValue(revertError('ResolverError', '0x'));
    client.readContract.mockResolvedValue(OWNER);
    await expect(getSpaceController('x.eth', '1')).rejects.toBeDefined();
    expect(client.readContract).not.toHaveBeenCalled();
  });

  test('keeps resolving a DNS-domain space whose resolver reverts bare', async () => {
    // un-imported DNS domains bare-revert both reads; the controller stays
    // the empty address as on master, not a rejection
    const client = mockClient();
    client.getEnsText.mockRejectedValue(revertError('ResolverError', '0x'));
    client.readContract.mockResolvedValue(EMPTY);
    client.getEnsAddress.mockRejectedValue(revertError('ResolverError', '0x'));
    await expect(getSpaceController('x.com', '1')).resolves.toBe(EMPTY);
  });
});

describe('getEnsOwner findOwner fallback', () => {
  const opts = { ensNameWrapper: EMPTY };

  test('reads the registry only on mainnet', async () => {
    const client = mockClient();
    client.readContract.mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner('x.eth', '1', opts)).resolves.toBe(OWNER);
    expect(client.readContract).toHaveBeenCalledTimes(1);
    expect(client.readContract.mock.calls[0][0].functionName).toBe('owner');
  });

  test('returns the findOwner result for a v2 name', async () => {
    const client = mockClient();
    client.readContract.mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner('x.eth', '11155111', opts)).resolves.toBe(OWNER);
    expect(client.readContract).toHaveBeenCalledTimes(1);
    expect(client.readContract.mock.calls[0][0].functionName).toBe('findOwner');
  });

  test('wire-encodes labels the strict DNS format cannot carry', async () => {
    const longLabel = 'a'.repeat(84);
    const client = mockClient();
    client.readContract.mockResolvedValueOnce(OWNER);
    await expect(
      getEnsOwner(`${longLabel}.eth`, '11155111', opts)
    ).resolves.toBe(OWNER);
    expect(client.readContract.mock.calls[0][0].args).toEqual([
      toHex(packetToBytes(`${longLabel}.eth`))
    ]);
  });

  test('takes the ENSv2 path for a numeric chain id too', async () => {
    const client = mockClient();
    client.readContract.mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner('x.eth', 11155111 as any, opts)).resolves.toBe(
      OWNER
    );
    expect(client.readContract.mock.calls[0][0].functionName).toBe('findOwner');
  });

  test('falls back to the registry when findOwner returns no owner', async () => {
    const client = mockClient();
    client.readContract
      .mockResolvedValueOnce(EMPTY)
      .mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner('x.eth', '11155111', opts)).resolves.toBe(OWNER);
    expect(client.readContract).toHaveBeenCalledTimes(2);
    expect(client.readContract.mock.calls[1][0].functionName).toBe('owner');
  });

  test.each([
    ['a decoded error', revertError('ResolverError', '0xdeadbeef')],
    ['an undecoded revert', undecodedRevert()],
    ['a transport failure', transportError]
  ])('throws when findOwner fails with %s', async (_label, error) => {
    const client = mockClient();
    client.readContract.mockRejectedValueOnce(error);
    await expect(getEnsOwner('x.eth', '11155111', opts)).rejects.toBeDefined();
    expect(client.readContract).toHaveBeenCalledTimes(1);
  });

  test('reads a bare revert as no address for an unclaimed DNS domain', async () => {
    const client = mockClient();
    client.readContract.mockResolvedValue(EMPTY);
    client.getEnsAddress.mockRejectedValue(revertError('ResolverError', '0x'));
    await expect(getEnsOwner('x.com', '1', opts)).resolves.toBe(EMPTY);
  });

  test('throws on a bare revert for a subdomain address read', async () => {
    const client = mockClient();
    client.readContract.mockResolvedValue(EMPTY);
    client.getEnsAddress.mockRejectedValue(revertError('ResolverError', '0x'));
    await expect(getEnsOwner('a.x.eth', '1', opts)).rejects.toBeDefined();
  });

  test('resolves subdomains through a strict address read', async () => {
    const client = mockClient();
    client.readContract.mockResolvedValue(EMPTY);
    client.getEnsAddress.mockResolvedValue(OWNER);
    await expect(getEnsOwner('a.x.eth', '1', opts)).resolves.toBe(OWNER);
    expect(client.getEnsAddress).toHaveBeenCalledWith(
      expect.objectContaining({ strict: true })
    );
  });
});
