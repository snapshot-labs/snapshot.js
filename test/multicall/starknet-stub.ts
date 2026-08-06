import multicall from '../../src/multicall/starknet';

const CONTRACT =
  '0x6ac597f8116f886fa1c97a23fa4e08299975ecaf6b598873ca6792b9bbfb678';
const MULTICALL_ADDRESS =
  '0x05754af3760f3356da99aea5c3ec39ccac7783d925a19666ebbeca58ff0087f4';

function stubProvider(responses: string[][]) {
  const flat = responses.flatMap((response) => [
    `0x${response.length.toString(16)}`,
    ...response
  ]);

  return {
    callContract: async () => ['0x1', `0x${flat.length.toString(16)}`, ...flat]
  } as any;
}

function call(fn: string) {
  return [CONTRACT, fn, []];
}

export async function parse(abi: any[], fn: string, response: string[]) {
  const results = await multicall(
    MULTICALL_ADDRESS,
    stubProvider([response]),
    abi,
    [call(fn)],
    50
  );

  return results[0];
}
