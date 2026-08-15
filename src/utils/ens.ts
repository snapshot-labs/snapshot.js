import { getAddress } from '@ethersproject/address';
import { ensNormalize } from '@ethersproject/hash';
import {
  concat,
  parseAbi,
  stringToBytes,
  toHex,
  ContractFunctionRevertedError
} from 'viem';
import { namehash } from 'viem/ens';
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
const UNIVERSAL_RESOLVER_ABI = parseAbi([
  'error ResolverNotFound(bytes name)',
  'error ResolverNotContract(bytes name, address resolver)',
  'error UnsupportedResolverProfile(bytes4 selector)',
  'error ResolverError(bytes errorData)',
  'error ReverseAddressMismatch(string primary, bytes primaryAddress)',
  'error HttpError(uint16 status, string message)',
  'function findOwner(bytes name) view returns (address owner)'
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

// takes an already-normalized name; DNS wire format per RFC 1035
function dnsEncodeName(name: string): Hex {
  const labels = name.split('.');
  const encodedLabels = labels.map((label) => {
    // DNS limits are in bytes, not characters
    const labelBytes = stringToBytes(label);
    if (!labelBytes.length || labelBytes.length > 63) {
      throw new Error(`Invalid ENS label: ${label}`);
    }
    return concat([Uint8Array.from([labelBytes.length]), labelBytes]);
  });
  const encoded = concat([...encodedLabels, new Uint8Array([0])]);
  if (encoded.length > 255) {
    throw new Error(`DNS-encoded name exceeds 255 bytes: ${name}`);
  }
  return toHex(encoded);
}

// strict mode so gateway/infra failures throw; only reverts that mean the
// name does not resolve (or a gateway 404) read as "no address"
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
    const revert =
      typeof e?.walk === 'function'
        ? e.walk((err: any) => err instanceof ContractFunctionRevertedError)
        : undefined;
    const errorName = (revert as any)?.data?.errorName;
    if (
      errorName === 'ResolverNotFound' ||
      errorName === 'ResolverNotContract' ||
      errorName === 'ResolverError' ||
      errorName === 'UnsupportedResolverProfile' ||
      (errorName === 'HttpError' && (revert as any)?.data?.args?.[0] === 404)
    ) {
      return null;
    }
    throw e;
  }
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

  // unresolvable names and resolver-level failures resolve to null;
  // transport failures throw instead of reading as "no record"
  return await client.getEnsText({
    name: normalized,
    key: record,
    universalResolverAddress,
    blockNumber: options.blockNumber,
    blockTag: options.blockTag
  });
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

  // names the DNS wire format cannot carry (e.g. labels over 63 bytes)
  // exist in the hash-based registry, so they skip findOwner only
  let dnsEncodedName: Hex | undefined;

  try {
    dnsEncodedName = dnsEncodeName(normalized);
  } catch (e: any) {
    dnsEncodedName = undefined;
  }

  const ensNameWrapper =
    options.ensNameWrapper || networks[network].ensNameWrapper;

  let owner: string = EMPTY_ADDRESS;

  // findOwner is ENSv2-only and reverts on deployments that predate it
  // (e.g. mainnet), which must fall back to the registry — but transport
  // failures must surface, not read as "unowned"
  if (dnsEncodedName) {
    try {
      owner = await client.readContract({
        address: universalResolverAddress,
        abi: UNIVERSAL_RESOLVER_ABI,
        functionName: 'findOwner',
        args: [dnsEncodedName]
      });
    } catch (e: any) {
      const revert =
        typeof e?.walk === 'function'
          ? e.walk((err: any) => err instanceof ContractFunctionRevertedError)
          : undefined;
      if (!revert) throw e;
      owner = EMPTY_ADDRESS;
    }
  }

  if (!owner || owner === EMPTY_ADDRESS) {
    owner = await client.readContract({
      address: ENS_REGISTRY,
      abi: ENS_REGISTRY_ABI,
      functionName: 'owner',
      args: [ensHash]
    });
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
