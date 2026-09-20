import { getAddress } from '@ethersproject/address';
import { ensNormalize } from '@ethersproject/hash';
import { parseAbi, toHex, ContractFunctionRevertedError } from 'viem';
import { namehash, packetToBytes } from 'viem/ens';
import type { Address, Hex } from 'viem';
import { getViemClient } from './viem';
import { fetch } from '../utils';
import networks from '../networks.json';

type DomainType = 'ens' | 'tld' | 'other-tld' | 'subdomain';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_REGISTRY_ABI = parseAbi([
  'function owner(bytes32 node) view returns (address)'
]);
const NAME_WRAPPER_ABI = parseAbi([
  'function ownerOf(uint256 id) view returns (address)'
]);
// errors mirror viem's universalResolverErrors, which it does not export
const UNIVERSAL_RESOLVER_ABI = parseAbi([
  'error DNSDecodingFailed(bytes dns)',
  'error DNSEncodingFailed(string ens)',
  'error EmptyAddress()',
  'error HttpError(uint16 status, string message)',
  'error InvalidBatchGatewayResponse()',
  'error ResolverError(bytes errorData)',
  'error ResolverNotContract(bytes name, address resolver)',
  'error ResolverNotFound(bytes name)',
  'error ReverseAddressMismatch(string primary, bytes primaryAddress)',
  'error UnsupportedResolverProfile(bytes4 selector)',
  'function ROOT_REGISTRY() view returns (address registry)',
  'function findResolver(bytes name) view returns (address resolver, bytes32 node, uint256 offset)'
]);
const UNIVERSAL_HELPER_ABI = parseAbi([
  'function ROOT_REGISTRY() view returns (address registry)',
  'function findExactOwner(bytes name) view returns (address owner)'
]);
const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

function getDomainType(domain: string): DomainType {
  const isEns = domain.endsWith('.eth');

  const tokens = domain.split('.');

  if (tokens.length === 1) return 'tld';
  else if (tokens.length === 2 && !isEns) return 'other-tld';
  else if (tokens.length > 2) return 'subdomain';
  else if (isEns) return 'ens';
  else throw new Error('Invalid domain');
}

// NotImplemented(), how DNS resolvers answer unsupported record profiles
const NOT_IMPLEMENTED_ERROR = '0xd6234725';

// reverts that mean "no record"; anything else (other ResolverError data,
// gateway 5xx, transport) is a failure and must throw: a record read that
// falls through to the name owner may authorize the wrong controller. The
// one class scoped by name: resolver-level errors are how DNS domains answer
// a read — their TLD resolvers revert NotImplemented() or bare on mainnet
// and UnreachableName(name) on Sepolia — so for other-tld names any
// ResolverError is a no-record answer (infrastructure failures arrive as
// HttpError or transport errors, never ResolverError); for .eth names a
// ResolverError beyond NotImplemented() is a resolver failure
function isNoRecordRevert(domainType: DomainType, e: any): boolean {
  const revert =
    typeof e?.walk === 'function'
      ? e.walk((err: any) => err instanceof ContractFunctionRevertedError)
      : undefined;
  const errorName = (revert as any)?.data?.errorName;
  const args = (revert as any)?.data?.args;
  return (
    errorName === 'ResolverNotFound' ||
    errorName === 'ResolverNotContract' ||
    errorName === 'UnsupportedResolverProfile' ||
    (errorName === 'ResolverError' &&
      (args?.[0] === NOT_IMPLEMENTED_ERROR || domainType === 'other-tld')) ||
    (errorName === 'HttpError' && args?.[0] === 404)
  );
}

async function delegatesToEnsV1(
  client: ReturnType<typeof getViemClient>,
  universalResolverAddress: Address,
  ensV1Delegates: string[],
  name: string
): Promise<boolean> {
  const [resolver] = await client.readContract({
    address: universalResolverAddress,
    abi: UNIVERSAL_RESOLVER_ABI,
    functionName: 'findResolver',
    args: [toHex(packetToBytes(name))]
  });

  return ensV1Delegates.some(
    (delegate) =>
      !!delegate && delegate.toLowerCase() === resolver.toLowerCase()
  );
}

async function getEnsAddressStrict(
  client: ReturnType<typeof getViemClient>,
  name: string,
  universalResolverAddress: Address
): Promise<string | null> {
  try {
    return await client.getEnsAddress({
      name,
      universalResolverAddress,
      strict: true
    });
  } catch (e: any) {
    if (isNoRecordRevert(getDomainType(name), e)) return null;
    throw e;
  }
}

// cache the promise, not the result, so concurrent callers share one in-flight
// check; TTL rather than forever so a long-running process still catches a
// redeploy
const ROOT_MATCH_TTL_MS = 5 * 60 * 1000;
const rootMatchCache = new WeakMap<
  ReturnType<typeof getViemClient>,
  Map<string, { promise: Promise<void>; expiresAt: number }>
>();

function verifyRootMatch(
  client: ReturnType<typeof getViemClient>,
  universalHelperAddress: Address,
  universalResolverAddress: Address
): Promise<void> {
  const key = `${universalHelperAddress}:${universalResolverAddress}`;
  let clientCache = rootMatchCache.get(client);
  if (!clientCache) {
    clientCache = new Map();
    rootMatchCache.set(client, clientCache);
  }

  const cached = clientCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = (async () => {
    const [helperRoot, resolverRoot] = await Promise.all([
      client.readContract({
        address: universalHelperAddress,
        abi: UNIVERSAL_HELPER_ABI,
        functionName: 'ROOT_REGISTRY'
      }),
      client.readContract({
        address: universalResolverAddress,
        abi: UNIVERSAL_RESOLVER_ABI,
        functionName: 'ROOT_REGISTRY'
      })
    ]);

    if (helperRoot !== resolverRoot) {
      throw new Error(
        `ENSv2 helper ${universalHelperAddress} reads root registry ${helperRoot}, universal resolver reads ${resolverRoot}`
      );
    }
  })();

  clientCache.set(key, { promise, expiresAt: Date.now() + ROOT_MATCH_TTL_MS });
  // evict on rejection so the next call retries
  promise.catch(() => clientCache.delete(key));

  return promise;
}

// see https://docs.ens.domains/registry/dns#gasless-import
async function getDNSOwner(domain: string): Promise<string> {
  const response = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${domain}&type=TXT`,
    {
      headers: {
        accept: 'application/dns-json'
      }
    }
  );

  const data = await response.json();
  // Error list: https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-6
  if (data.Status === 3) return EMPTY_ADDRESS;
  if (data.Status !== 0) throw new Error('Failed to fetch DNS Owner');

  const ownerRecord = data.Answer?.find((record: any) =>
    record.data.includes('ENS1')
  );

  if (!ownerRecord) return EMPTY_ADDRESS;

  return getAddress(
    ownerRecord.data.replace(new RegExp('"', 'g'), '').split(' ').pop()
  );
}

export async function getEnsTextRecord(
  ens: string,
  record: string,
  network = '1',
  options: any = {}
) {
  let normalized: string;

  // ensNormalize rather than viem's normalize: they ship different revisions
  // of the ENSIP-15 tables, and viem rejects names of existing spaces
  try {
    normalized = ensNormalize(ens);
  } catch (e: any) {
    return null;
  }

  const universalResolverAddress = networks[network]?.ensUniversalResolver;

  if (!universalResolverAddress) {
    throw new Error('Network not supported');
  }

  const client = getViemClient(network, options);

  try {
    return await client.getEnsText({
      name: normalized,
      key: record,
      universalResolverAddress,
      blockNumber: options.blockNumber,
      blockTag: options.blockTag,
      strict: true
    });
  } catch (e: any) {
    if (isNoRecordRevert(getDomainType(normalized), e)) return null;
    throw e;
  }
}

export async function getEnsOwner(
  ens: string,
  network = '1',
  options: any = {}
): Promise<string> {
  const universalResolverAddress = networks[network]?.ensUniversalResolver;

  if (!universalResolverAddress) {
    throw new Error('Network not supported');
  }

  const domainType = getDomainType(ens);
  const client = getViemClient(network, options);

  let normalized: string;
  let ensHash: Hex;

  try {
    normalized = ensNormalize(ens);
    ensHash = namehash(normalized);
  } catch (e: any) {
    return EMPTY_ADDRESS;
  }

  const ensNameWrapper =
    options.ensNameWrapper || networks[network].ensNameWrapper;

  let owner: string = EMPTY_ADDRESS;

  // the helper is not behind the resolver proxy: a redeploy leaves this pin
  // answering from an abandoned root, hence the root check. A name absent from
  // ENSv2 returns EMPTY_ADDRESS, so a revert is a failure: never catch it into
  // the v1 fallback
  const universalHelperAddress =
    options.ensUniversalHelper || networks[network].ensUniversalHelper;

  // without both pins the gate below silently skips the v1 read for every name
  if (
    universalHelperAddress &&
    (!networks[network].ensV1Resolver || !networks[network].ensDnsTldResolver)
  ) {
    throw new Error(
      `Network ${network} has ensUniversalHelper set but is missing ${
        !networks[network].ensV1Resolver ? 'ensV1Resolver' : 'ensDnsTldResolver'
      }`
    );
  }

  if (universalHelperAddress) {
    await verifyRootMatch(
      client,
      universalHelperAddress,
      universalResolverAddress
    );

    owner = await client.readContract({
      address: universalHelperAddress,
      abi: UNIVERSAL_HELPER_ABI,
      functionName: 'findExactOwner',
      // viem's own encoding, so labels the strict DNS format rejects still resolve
      args: [toHex(packetToBytes(normalized))]
    });
  }

  // a name ENSv2 has taken over, or whose .eth reservation expired in v2,
  // keeps a stale v1 entry: read v1 only where ENSv2 still delegates to it
  if (!owner || owner === EMPTY_ADDRESS) {
    const readsEnsV1 =
      !universalHelperAddress ||
      (await delegatesToEnsV1(
        client,
        universalResolverAddress,
        [networks[network].ensV1Resolver, networks[network].ensDnsTldResolver],
        normalized
      ));

    if (readsEnsV1) {
      owner = await client.readContract({
        address: ENS_REGISTRY,
        abi: ENS_REGISTRY_ABI,
        functionName: 'owner',
        args: [ensHash]
      });
    }
  }
  // If owner is the ENSNameWrapper contract, resolve the owner of the name
  if (owner === ensNameWrapper) {
    owner = await client.readContract({
      address: ensNameWrapper as Address,
      abi: NAME_WRAPPER_ABI,
      functionName: 'ownerOf',
      args: [BigInt(ensHash)]
    });
  }

  if (owner === EMPTY_ADDRESS && domainType === 'other-tld') {
    const resolvedAddress = await getEnsAddressStrict(
      client,
      normalized,
      universalResolverAddress
    );

    // Filter out domains with valid TXT records, but not imported
    if (resolvedAddress) {
      owner = await getDNSOwner(ens);
    }
  }

  if (owner === EMPTY_ADDRESS && domainType === 'subdomain') {
    owner =
      (await getEnsAddressStrict(
        client,
        normalized,
        universalResolverAddress
      )) || EMPTY_ADDRESS;
  }

  return owner || EMPTY_ADDRESS;
}
