import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ContractFunctionRevertedError, toHex } from 'viem';
import { namehash, packetToBytes } from 'viem/ens';
import networks from '../networks.json';
import { getEnsTextRecord, getEnsOwner } from './ens';
import { getSpaceController } from '../utils';
import { getViemClient } from './viem';
import getProvider from './provider';

vi.mock('./viem', () => ({ getViemClient: vi.fn() }));
vi.mock('./provider', () => ({ default: vi.fn() }));

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
    // the root check is cached per client uid
    uid: String(Math.random()),
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
  vi.mocked(getProvider).mockReset();
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
  test('forwards the client name to its provider', async () => {
    const client = mockClient();
    client.getEnsText.mockResolvedValue(OWNER);

    await expect(
      getSpaceController('x.eth', '1', { clientName: 'sequencer' })
    ).resolves.toBe(OWNER);
    expect(getViemClient).toHaveBeenCalledWith('1', {
      clientName: 'sequencer'
    });
  });

  test('forwards the client name to the Sonic provider', async () => {
    vi.mocked(getProvider).mockImplementation(() => {
      throw new Error('stop');
    });

    await expect(
      getSpaceController('review.sonic', '146', { clientName: 'sequencer' })
    ).resolves.toBe(EMPTY);
    expect(getProvider).toHaveBeenCalledWith('146', {
      clientName: 'sequencer'
    });
  });

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

describe('getEnsOwner findExactOwner fallback', () => {
  const opts = { ensNameWrapper: EMPTY };
  const ROOT = '0xa1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1';
  const V1_RESOLVER = networks['11155111'].ensV1Resolver;
  const DNS_TLD_RESOLVER = networks['11155111'].ensDnsTldResolver;
  const OTHER_RESOLVER = '0xb2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2';
  const ensHash = namehash('x.eth');

  // verifyRootMatch issues its two ROOT_REGISTRY reads before anything else
  function mockVerifiedClient() {
    const client = mockClient();
    client.readContract.mockResolvedValueOnce(ROOT).mockResolvedValueOnce(ROOT);
    return client;
  }

  test('reads the registry only on mainnet', async () => {
    const client = mockClient();
    client.readContract.mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner('x.eth', '1', opts)).resolves.toBe(OWNER);
    expect(client.readContract).toHaveBeenCalledTimes(1);
    expect(client.readContract.mock.calls[0][0].functionName).toBe('owner');
  });

  test('throws when ensUniversalHelper is set on a network missing the v1 delegate pins', async () => {
    mockClient();
    await expect(
      getEnsOwner('x.eth', '1', { ...opts, ensUniversalHelper: ROOT })
    ).rejects.toThrow('ensV1Resolver');
  });

  test('returns the findExactOwner result for a v2 name', async () => {
    const client = mockVerifiedClient();
    client.readContract.mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner('x.eth', '11155111', opts)).resolves.toBe(OWNER);
    expect(client.readContract).toHaveBeenCalledTimes(3);
    expect(client.readContract.mock.calls[2][0].functionName).toBe(
      'findExactOwner'
    );
  });

  test('throws when the helper reads a root registry the resolver does not', async () => {
    const client = mockClient();
    client.readContract
      .mockResolvedValueOnce(EMPTY)
      .mockResolvedValueOnce(ROOT)
      .mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner('x.eth', '11155111', opts)).rejects.toThrow(
      'root registry'
    );
    expect(client.readContract).toHaveBeenCalledTimes(2);
  });

  test('wire-encodes labels the strict DNS format cannot carry', async () => {
    const longLabel = 'a'.repeat(84);
    const client = mockVerifiedClient();
    client.readContract.mockResolvedValueOnce(OWNER);
    await expect(
      getEnsOwner(`${longLabel}.eth`, '11155111', opts)
    ).resolves.toBe(OWNER);
    expect(client.readContract.mock.calls[2][0].args).toEqual([
      toHex(packetToBytes(`${longLabel}.eth`))
    ]);
  });

  test('takes the ENSv2 path for a numeric chain id too', async () => {
    const client = mockVerifiedClient();
    client.readContract.mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner('x.eth', 11155111 as any, opts)).resolves.toBe(
      OWNER
    );
    expect(client.readContract.mock.calls[2][0].functionName).toBe(
      'findExactOwner'
    );
  });

  test.each([
    ['a name ENSv2 still mirrors from v1', 'x.eth', V1_RESOLVER],
    [
      'a DNS name ENSv2 resolves through the v1 import path',
      'x.com',
      DNS_TLD_RESOLVER
    ]
  ])('falls back to the registry for %s', async (_label, name, resolver) => {
    const client = mockVerifiedClient();
    client.readContract
      .mockResolvedValueOnce(EMPTY)
      .mockResolvedValueOnce([resolver, ensHash, BigInt(0)])
      .mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner(name, '11155111', opts)).resolves.toBe(OWNER);
    expect(client.readContract).toHaveBeenCalledTimes(5);
    expect(client.readContract.mock.calls[3][0].functionName).toBe(
      'findResolver'
    );
    expect(client.readContract.mock.calls[4][0].functionName).toBe('owner');
  });

  test.each([
    ['a name resolving through ENSv2', OTHER_RESOLVER],
    ['a .eth name whose v2 reservation expired', EMPTY]
  ])(
    'leaves %s unowned instead of reading its stale v1 entry',
    async (_label, resolver) => {
      const client = mockVerifiedClient();
      client.readContract
        .mockResolvedValueOnce(EMPTY)
        .mockResolvedValueOnce([resolver, ensHash, BigInt(0)])
        .mockResolvedValueOnce(OWNER);
      await expect(
        // a wrapper address of its own: the shared one is the empty address,
        // which an unowned name would match
        getEnsOwner('x.eth', '11155111', { ensNameWrapper: OTHER_RESOLVER })
      ).resolves.toBe(EMPTY);
      expect(client.readContract).toHaveBeenCalledTimes(4);
    }
  );

  test.each([
    ['a decoded error', revertError('ResolverError', '0xdeadbeef')],
    ['an undecoded revert', undecodedRevert()],
    ['a transport failure', transportError]
  ])('throws when an ENSv2 read fails with %s', async (_label, error) => {
    const client = mockVerifiedClient();
    client.readContract.mockRejectedValueOnce(error);
    await expect(getEnsOwner('x.eth', '11155111', opts)).rejects.toBeDefined();
    expect(client.readContract).toHaveBeenCalledTimes(3);
  });

  test("throws when the helper's ROOT_REGISTRY read fails", async () => {
    const client = mockClient();
    client.readContract
      .mockRejectedValueOnce(transportError)
      .mockResolvedValueOnce(ROOT);
    await expect(getEnsOwner('x.eth', '11155111', opts)).rejects.toBeDefined();
    expect(client.readContract).toHaveBeenCalledTimes(2);
  });

  test("throws when the resolver's ROOT_REGISTRY read fails", async () => {
    const client = mockClient();
    client.readContract
      .mockResolvedValueOnce(ROOT)
      .mockRejectedValueOnce(transportError);
    await expect(getEnsOwner('x.eth', '11155111', opts)).rejects.toBeDefined();
    expect(client.readContract).toHaveBeenCalledTimes(2);
  });

  const rootReads = (client: ReturnType<typeof mockClient>) =>
    client.readContract.mock.calls.filter(
      (call) => call[0].functionName === 'ROOT_REGISTRY'
    ).length;

  test('retries the root check after a failed one', async () => {
    const client = mockClient();
    client.readContract
      .mockRejectedValueOnce(transportError)
      .mockResolvedValueOnce(ROOT);
    await expect(getEnsOwner('x.eth', '11155111', opts)).rejects.toBeDefined();
    client.readContract
      .mockResolvedValueOnce(ROOT)
      .mockResolvedValueOnce(ROOT)
      .mockResolvedValueOnce(OWNER);
    await expect(getEnsOwner('x.eth', '11155111', opts)).resolves.toBe(OWNER);
    expect(rootReads(client)).toBe(4);
  });

  test('checks the root once per client within the TTL', async () => {
    const client = mockVerifiedClient();
    client.readContract.mockResolvedValue(OWNER);
    await getEnsOwner('x.eth', '11155111', opts);
    await getEnsOwner('x.eth', '11155111', opts);
    expect(rootReads(client)).toBe(2);
  });

  test('re-checks the root once the TTL lapses', async () => {
    vi.useFakeTimers();
    try {
      const client = mockVerifiedClient();
      client.readContract
        .mockResolvedValueOnce(OWNER)
        .mockResolvedValueOnce(ROOT)
        .mockResolvedValueOnce(ROOT)
        .mockResolvedValueOnce(OWNER);
      await getEnsOwner('x.eth', '11155111', opts);
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
      await getEnsOwner('x.eth', '11155111', opts);
      expect(rootReads(client)).toBe(4);
    } finally {
      vi.useRealTimers();
    }
  });

  test('throws when the v1 delegation check findResolver call fails', async () => {
    const client = mockVerifiedClient();
    client.readContract
      .mockResolvedValueOnce(EMPTY)
      .mockRejectedValueOnce(transportError);
    await expect(getEnsOwner('x.eth', '11155111', opts)).rejects.toBeDefined();
    expect(client.readContract).toHaveBeenCalledTimes(4);
  });

  test('resolves the name-wrapper owner when findExactOwner returns the wrapper address', async () => {
    const client = mockVerifiedClient();
    client.readContract
      .mockResolvedValueOnce(OTHER_RESOLVER)
      .mockResolvedValueOnce(OWNER);
    await expect(
      getEnsOwner('x.eth', '11155111', { ensNameWrapper: OTHER_RESOLVER })
    ).resolves.toBe(OWNER);
    expect(client.readContract).toHaveBeenCalledTimes(4);
    expect(client.readContract.mock.calls[3][0].functionName).toBe('ownerOf');
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
