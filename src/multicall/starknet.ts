import { num, RpcProvider, shortString, transaction, uint256 } from 'starknet';

/**
 * Re-encodes a decoded short string to the felt it came from.
 *
 * `shortString.encodeShortString` is not a faithful inverse of
 * `decodeShortString`: it builds the hex with `charCodeAt(0).toString(16)` and
 * no zero padding, so every byte below `0x10` comes back one hex digit short.
 * `0x55534409436f696e` ("USD\tCoin") re-encodes as `0x5553449436f696e`.
 *
 * The `0x7f` bound is the one `encodeShortString` enforces through `isASCII`,
 * and it is load bearing rather than incidental: a felt holding a byte above
 * `0x7f` decodes to mojibake that `BigInt()` cannot read back, so it has to
 * stay a raw felt. Returns `undefined` when the string cannot be a felt's
 * bytes, which is a rejection rather than a value.
 */
function encodeShortStringPadded(value: string): string | undefined {
  if (value.length === 0) return undefined;

  let hex = '';

  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);

    if (code > 0x7f) return undefined;

    hex += code.toString(16).padStart(2, '0');
  }

  return `0x${hex}`;
}

function decodeFelt252(rawValue: string): string {
  try {
    const decoded = shortString.decodeShortString(rawValue);
    const reEncoded = encodeShortStringPadded(decoded);

    return reEncoded !== undefined &&
      num.toBigInt(reEncoded) === num.toBigInt(rawValue)
      ? decoded
      : rawValue;
  } catch {
    return rawValue;
  }
}

/**
 * Parses the raw result from a Starknet function call based on its ABI.
 * It handles different types like felt252, u8, u256, etc., and decodes them accordingly.
 * @param rawResult - The raw result from the Starknet function call.
 * @param functionAbi - The ABI of the function that was called.
 * @returns The parsed result in a more usable format.
 */
function parseStarknetResult(rawResult: string[], functionAbi: any): any {
  if (
    !functionAbi ||
    !functionAbi.outputs ||
    !Array.isArray(rawResult) ||
    rawResult.length === 0
  ) {
    return rawResult;
  }

  // Parse each output according to its type
  const outputs = functionAbi.outputs;
  const results: any[] = [];
  let rawIndex = 0; // Track position in rawResult array

  try {
    for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
      const output = outputs[outputIndex];
      const rawValue = rawResult[rawIndex];

      switch (output.type) {
        case 'core::felt252':
          results.push(decodeFelt252(rawValue));
          rawIndex++;
          break;
        case 'core::array::Span::<core::felt252>':
        case 'core::array::Array::<core::felt252>': {
          if (rawValue === undefined) {
            // The response ran out before this output. Degrade like every
            // other case does rather than throwing out of the loop, which
            // would discard the outputs already parsed. Not `[]`, which a
            // caller cannot tell from a genuinely empty span.
            results.push(undefined);
            rawIndex++;
            break;
          }

          const length = Number(num.toBigInt(rawValue));

          // Span items are opaque: only the caller knows whether they hold
          // text, so they are returned as raw felts.
          results.push(rawResult.slice(rawIndex + 1, rawIndex + 1 + length));
          rawIndex += 1 + length;
          break;
        }
        case 'core::integer::u8':
        case 'core::integer::u16':
        case 'core::integer::u32':
        case 'core::integer::u64':
          results.push(parseInt(rawValue, 16));
          rawIndex++;
          break;
        case 'core::integer::u128':
        case 'core::integer::usize':
          results.push(BigInt(rawValue).toString());
          rawIndex++;
          break;
        case 'core::integer::u256':
          results.push(
            uint256.uint256ToBN({
              low: rawValue,
              high: rawResult[rawIndex + 1] || '0x0'
            })
          );
          rawIndex += 2; // u256 uses two slots
          break;
        case 'core::integer::i8':
        case 'core::integer::i16':
        case 'core::integer::i32':
        case 'core::integer::i64':
          results.push(parseInt(rawValue, 16));
          rawIndex++;
          break;
        case 'core::integer::i128':
          results.push(BigInt(rawValue).toString());
          rawIndex++;
          break;
        case 'core::bool':
          results.push(rawValue === '0x1' || rawValue === '0x01');
          rawIndex++;
          break;
        case 'core::starknet::contract_address::ContractAddress':
        case 'core::starknet::class_hash::ClassHash':
        case 'core::starknet::storage_access::StorageAddress':
          results.push(rawValue);
          rawIndex++;
          break;
        case 'core::bytes_31::bytes31':
          results.push(rawValue);
          rawIndex++;
          break;
        default:
          results.push(rawValue);
          rawIndex++;
      }
    }
    return results;
  } catch {
    return rawResult;
  }
}

/**
 * Partitions the responses from a Starknet multicall into individual call results.
 * Each response starts with its length, followed by the actual response data.
 * @param responses - The array of responses from the Starknet multicall.
 * @returns An array of arrays, where each inner array contains the response data for a single call.
 */
const partitionResponses = (responses: string[]): string[][] => {
  if (responses.length === 0) {
    return [];
  }

  const [responseLength, ...restResponses] = responses;
  const responseLengthInt = Number(num.toBigInt(responseLength));
  const response = restResponses.slice(0, responseLengthInt);
  const remainingResponses = restResponses.slice(responseLengthInt);

  return [response, ...partitionResponses(remainingResponses)];
};

export default async function multicall(
  address: string,
  provider: RpcProvider,
  abi: any[],
  calls: any[],
  limit: number,
  options: Record<string, any> = {}
) {
  const callData = calls.map((call) => {
    return {
      contractAddress: call[0],
      entrypoint: call[1],
      calldata: call[2] || []
    };
  });

  // Chunk calls into batches based on limit
  const chunks: any[][] = [];
  for (let i = 0; i < callData.length; i += limit) {
    chunks.push(callData.slice(i, i + limit));
  }

  // Process each chunk
  const paginatedResults = await Promise.all(
    chunks.map((chunk) =>
      provider.callContract(
        {
          contractAddress: address,
          entrypoint: 'aggregate',
          calldata: transaction.fromCallsToExecuteCalldata(chunk)
        },
        options.blockTag ?? 'latest'
      )
    )
  );

  const callResults = paginatedResults
    .map((callContractResult) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_blockNumber, _totalLength, ...results] = callContractResult;
      return partitionResponses(results);
    })
    .flat();

  return callResults.map((result, index) => {
    const [, functionName] = calls[index];
    const functionAbi = abi.find((item) => item.name === functionName);

    const parsedResult = parseStarknetResult(result, functionAbi);
    return parsedResult;
  });
}
