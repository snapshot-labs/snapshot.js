import { Contract } from '@ethersproject/contracts';
import { getAddress } from '@ethersproject/address';
import { namehash, normalize } from 'viem/ens';
import getProvider from './provider';
import { getViemClient } from './viem';
import { fetch } from '../utils';
import networks from '../networks.json';

type DomainType = 'ens' | 'tld' | 'other-tld' | 'subdomain';

const MUTED_ERRORS = [
  // mute error from coinbase, when the subdomain is not found
  // most other resolvers just return an empty address
  'response not found during CCIP fetch',
  // mute error from missing offchain resolver (mostly for sepolia)
  'UNSUPPORTED_OPERATION'
];
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
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

  try {
    normalized = normalize(ens);
  } catch (e: any) {
    return null;
  }

  const universalResolverAddress = networks[network]?.ensUniversalResolver;

  if (!universalResolverAddress) {
    throw new Error('Network not supported');
  }

  const client = getViemClient(network, options);

  // viem returns null for unresolvable names and resolver-level failures
  // (including CCIP gateway errors, matching the previous behavior where
  // offchain records were unreadable); RPC transport failures still throw
  return await client.getEnsText({
    name: normalized,
    key: record,
    universalResolverAddress
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
  const provider = getProvider(network, options);
  const ensRegistry = new Contract(
    ENS_REGISTRY,
    ['function owner(bytes32) view returns (address)'],
    provider
  );

  let ensHash: string;

  try {
    ensHash = namehash(normalize(ens));
  } catch (e: any) {
    return EMPTY_ADDRESS;
  }

  const ensNameWrapper =
    options.ensNameWrapper || networks[network].ensNameWrapper;
  let owner = await ensRegistry.owner(ensHash);
  // If owner is the ENSNameWrapper contract, resolve the owner of the name
  if (owner === ensNameWrapper) {
    const ensNameWrapperContract = new Contract(
      ensNameWrapper,
      ['function ownerOf(uint256) view returns (address)'],
      provider
    );
    owner = await ensNameWrapperContract.ownerOf(ensHash);
  }

  if (owner === EMPTY_ADDRESS && domainType === 'other-tld') {
    const resolvedAddress = await provider.resolveName(ens);

    // Filter out domains with valid TXT records, but not imported
    if (resolvedAddress) {
      owner = await getDNSOwner(ens);
    }
  }

  if (owner === EMPTY_ADDRESS && domainType === 'subdomain') {
    try {
      owner = await provider.resolveName(ens);
    } catch (e: any) {
      if (MUTED_ERRORS.every((error) => !e.message.includes(error))) {
        throw e;
      }
      owner = EMPTY_ADDRESS;
    }
  }

  return owner || EMPTY_ADDRESS;
}
