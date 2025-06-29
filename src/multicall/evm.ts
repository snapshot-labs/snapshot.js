import {
  Fragment,
  FunctionFragment,
  Interface,
  JsonFragment
} from '@ethersproject/abi';
import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';

const multicallAbi = [
  'function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)'
];

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
    return results.map((call, i) =>
      itf.decodeFunctionResult(calls[i][1], call)
    );
  } catch (e: any) {
    return Promise.reject(e);
  }
}
