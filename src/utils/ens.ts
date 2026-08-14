import { getAddress } from '@ethersproject/address';
import { ensNormalize } from '@ethersproject/hash';
import { parseAbi, HttpRequestError } from 'viem';
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
  if (!networks[network]?.ensResolvers?.length) {
    throw new Error('Network not supported');
  }

  const domainType = getDomainType(ens);
  const client = getViemClient(network, options);
  const universalResolverAddress = networks[network]?.ensUniversalResolver;

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
  let owner: string = await client.readContract({
    address: ENS_REGISTRY,
    abi: ENS_REGISTRY_ABI,
    functionName: 'owner',
    args: [ensHash]
  });
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
    const resolvedAddress = await client.getEnsAddress({
      name: normalized,
      universalResolverAddress
    });

    // Filter out domains with valid TXT records, but not imported
    if (resolvedAddress) {
      owner = await getDNSOwner(ens);
    }
  }

  if (owner === EMPTY_ADDRESS && domainType === 'subdomain') {
    // a CCIP gateway 404 means the name does not exist; anything else throws
    try {
      owner =
        (await client.getEnsAddress({
          name: normalized,
          universalResolverAddress
        })) || EMPTY_ADDRESS;
    } catch (e: any) {
      const httpError =
        typeof e?.walk === 'function'
          ? e.walk((err: any) => err instanceof HttpRequestError)
          : undefined;
      if (!httpError || httpError.status !== 404) throw e;
      owner = EMPTY_ADDRESS;
    }
  }

  return owner || EMPTY_ADDRESS;
}
