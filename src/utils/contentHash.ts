// https://github.com/ensdomains/ui/blob/master/src/utils/contents.js
// https://github.com/Uniswap/uniswap-interface/blob/master/src/utils/resolveENSContentHash.ts
import contentHash from '@ensdomains/content-hash';
import { Provider } from '@ethersproject/abstract-provider';
import { namehash } from '@ethersproject/hash';
import { isHexString } from '@ethersproject/bytes';
import bs58 from 'bs58';
import { call } from '../utils';
const supportedCodecs = ['ipns-ns', 'ipfs-ns', 'swarm-ns', 'onion', 'onion3'];

const REGISTRAR_ABI = [
  {
    constant: true,
    inputs: [
      {
        name: 'node',
        type: 'bytes32'
      }
    ],
    name: 'resolver',
    outputs: [
      {
        name: 'resolverAddress',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

const REGISTRAR_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

const RESOLVER_ABI = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32'
      }
    ],
    name: 'contenthash',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

export function decodeContenthash(encoded) {
  let decoded, protocolType, error;
  if (encoded.error) {
    return { protocolType: null, decoded: encoded.error };
  }
  if (encoded) {
    try {
      decoded = contentHash.decode(encoded);
      const codec = contentHash.getCodec(encoded);
      if (codec === 'ipfs-ns') {
        // convert the ipfs from base58 to base32 (url host compatible)
        // if needed the hash can now be resolved through a secured origin gateway (<hash>.gateway.com)
        decoded = contentHash.helpers.cidV0ToV1Base32(decoded);

        protocolType = 'ipfs';
      } else if (codec === 'ipns-ns') {
        decoded = bs58.decode(decoded).slice(2).toString();
        protocolType = 'ipns';
      } else if (codec === 'swarm-ns') {
        protocolType = 'bzz';
      } else if (codec === 'onion') {
        protocolType = 'onion';
      } else if (codec === 'onion3') {
        protocolType = 'onion3';
      } else {
        decoded = encoded;
      }
    } catch (e) {
      error = e.message;
    }
  }
  return { protocolType, decoded, error };
}

export function validateContent(encoded) {
  return (
    contentHash.isHashOfType(encoded, contentHash.Types.ipfs) ||
    contentHash.isHashOfType(encoded, contentHash.Types.swarm)
  );
}

export function isValidContenthash(encoded) {
  try {
    const codec = contentHash.getCodec(encoded);
    return isHexString(encoded) && supportedCodecs.includes(codec);
  } catch (e) {
    console.log(e);
  }
}

export function encodeContenthash(text) {
  let content, contentType;
  let encoded: any = false;
  if (text) {
    const matched =
      text.match(/^(ipfs|ipns|bzz|onion|onion3):\/\/(.*)/) ||
      text.match(/\/(ipfs)\/(.*)/) ||
      text.match(/\/(ipns)\/(.*)/);
    if (matched) {
      contentType = matched[1];
      content = matched[2];
    }
    try {
      if (contentType === 'ipfs') {
        if (content.length >= 4) {
          encoded = '0x' + contentHash.encode('ipfs-ns', content);
        }
      } else if (contentType === 'ipns') {
        const bs58content = bs58.encode(
          Buffer.concat([
            Buffer.from([0, content.length]),
            Buffer.from(content)
          ])
        );
        encoded = '0x' + contentHash.encode('ipns-ns', bs58content);
      } else if (contentType === 'bzz') {
        if (content.length >= 4) {
          encoded = '0x' + contentHash.fromSwarm(content);
        }
      } else if (contentType === 'onion') {
        if (content.length == 16) {
          encoded = '0x' + contentHash.encode('onion', content);
        }
      } else if (contentType === 'onion3') {
        if (content.length == 56) {
          encoded = '0x' + contentHash.encode('onion3', content);
        }
      } else {
        console.warn('Unsupported protocol or invalid value', {
          contentType,
          text
        });
      }
    } catch (err) {
      console.warn('Error encoding content hash', { text, encoded });
      //throw 'Error encoding content hash'
    }
  }
  return encoded;
}

/**
 * Fetches and decodes the result of an ENS contenthash lookup on mainnet to a URI
 * @param ensName to resolve
 * @param provider provider to use to fetch the data
 */
export async function resolveENSContentHash(
  ensName: string,
  provider: Provider
): Promise<string> {
  const hash = namehash(ensName);
  const resolverAddress = await call(provider, REGISTRAR_ABI, [
    REGISTRAR_ADDRESS,
    'resolver',
    [hash]
  ]);
  return await call(provider, RESOLVER_ABI, [
    resolverAddress,
    'contenthash',
    [hash]
  ]);
}

export async function resolveContent(provider, name) {
  const contentHash = await resolveENSContentHash(name, provider);
  return decodeContenthash(contentHash);
}
