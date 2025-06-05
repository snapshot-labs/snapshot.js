import { num, RpcProvider, shortString, transaction, uint256 } from 'starknet';

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

  const output = functionAbi.outputs[0];
  const rawValue = rawResult[0];

  try {
    switch (output.type) {
      case 'core::felt252':
        // Try to decode as shortString (for name, symbol)
        try {
          return shortString.decodeShortString(rawValue);
        } catch {
          // If shortString decode fails, return as hex
          return rawValue;
        }

      case 'core::integer::u8':
        return parseInt(rawValue, 16);

      case 'core::integer::u256':
        return uint256.uint256ToBN({
          low: rawValue,
          high: rawResult[1] || '0x0'
        });

      case 'core::integer::u128':
        return parseInt(rawValue, 16).toString();

      case 'core::integer::u64':
      case 'core::integer::u32':
      case 'core::integer::u16':
        return parseInt(rawValue, 16);

      default:
        // Return raw value for unknown types
        return rawValue;
    }
  } catch {
    // Fallback to raw result if parsing fails
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

    return [parseStarknetResult(result, functionAbi)];
  });
}
