import { ContractBatchProvider } from '@argent/x-multicall';
import { RpcProvider, shortString, uint256 } from 'starknet';

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

export default async function multicall(
  address: string,
  provider: RpcProvider,
  abi: any[],
  calls: any[],
  limit: number
) {
  const multicallProvider = new ContractBatchProvider(provider, address);

  // Chunk calls into batches based on limit
  const chunks: any[][] = [];
  for (let i = 0; i < calls.length; i += limit) {
    chunks.push(calls.slice(i, i + limit));
  }

  // Process each chunk
  const results = await Promise.all(
    chunks.map((chunk) =>
      Promise.all(
        chunk.map(async (callData) => {
          const [contractAddress, functionName, args] = callData;

          // Make the call using ContractBatchProvider
          return multicallProvider.callContract({
            contractAddress,
            entrypoint: functionName,
            calldata: args || []
          });
        })
      )
    )
  );

  // Flatten results from all chunks
  const flatResults = results.flat();

  return flatResults.map((rawResult, index) => {
    const [, functionName] = calls[index];
    const functionAbi = abi.find((item) => item.name === functionName);
    return [parseStarknetResult(rawResult, functionAbi)];
  });
}
