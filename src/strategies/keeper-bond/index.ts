import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.0';

const abi = [
    {
      input: [
        { internalType: "address", "name": "", "type": "address" },
        { internalType: "address", "name": "", "type": "address" }
      ],
      name: "bonds",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function"
    }
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.address, 'bonds', [address,options.address]]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals))
    ])
  );
}
