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

// NotImplemented(), how DNS resolvers answer unsupported record profiles
const NOT_IMPLEMENTED_ERROR = '0xd6234725';

// reverts that mean "no record"; anything else (other ResolverError data,
// gateway 5xx, transport) is a failure and must throw
function isNoRecordRevert(e: any): boolean {
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
      (args?.[0] === '0x' || args?.[0] === NOT_IMPLEMENTED_ERROR)) ||
    (errorName === 'HttpError' && args?.[0] === 404)
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
    if (isNoRecordRevert(e)) return null;
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
    if (isNoRecordRevert(e)) return null;
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

  // viem's own encoding, so labels the strict DNS format rejects still resolve
  const dnsEncodedName = toHex(packetToBytes(normalized));

  const ensNameWrapper =
    options.ensNameWrapper || networks[network].ensNameWrapper;

  let owner: string = EMPTY_ADDRESS;

  // findOwner is ENSv2-only, live on Sepolia and not yet on mainnet; a decoded
  // revert or transport failure must throw, not resolve a stale v1 owner
  if (network === '11155111') {
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
      if (!revert || (revert as any).data?.errorName) throw e;
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
