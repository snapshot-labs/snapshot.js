import {
  defaultAbiCoder,
  Fragment,
  FunctionFragment,
  Interface,
  JsonFragment
} from '@ethersproject/abi';
import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';
import { parseBytes32String } from '@ethersproject/strings';

const multicallAbi = [
  'function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)'
];

// Legacy tokens (MKR/SAI/AVT-era) declare `string` in the ABI but return
// `bytes32`. Fall back to bytes32 decoding so one such call doesn't fail
// the whole batch.
function decodeResult(
  itf: Interface,
  fn: FunctionFragment | string,
  data: string
): any {
  try {
    return itf.decodeFunctionResult(fn, data);
  } catch (e) {
    const outputs = (typeof fn === 'string' ? itf.getFunction(fn) : fn).outputs;
    if (!outputs?.some((o) => o.type === 'string')) throw e;
    const altTypes = outputs.map((o) =>
      o.type === 'string' ? 'bytes32' : o.type
    );
    return defaultAbiCoder
      .decode(altTypes, data)
      .map((v, i) =>
        outputs[i].type === 'string' ? parseBytes32String(v) : v
      );
  }
}

export default async function multicall(
  address: string,
  provider: Signer | Provider,
  abi: string | (Fragment | JsonFragment | string)[],
  calls: [string, FunctionFragment | string, any[]][],
  limit: number,
  options = {}
): Promise<any> {
  const multi = new Contract(address, multicallAbi, provider);
  const itf = new Interface(abi);
  try {
    const pages = Math.ceil(calls.length / limit);
    const promises: any = [];
    Array.from(Array(pages)).forEach((x, i) => {
      const callsInPage = calls.slice(limit * i, limit * (i + 1));
      promises.push(
        multi.aggregate(
          callsInPage.map((call) => [
            call[0].toLowerCase(),
            itf.encodeFunctionData(call[1], call[2])
          ]),
          options
        )
      );
    });
    let results: any[] = await Promise.all(promises);
    results = results.reduce((prev: any, [, res]: any) => prev.concat(res), []);
    return results.map((call, i) => decodeResult(itf, calls[i][1], call));
  } catch (e: any) {
    return Promise.reject(e);
  }
}
