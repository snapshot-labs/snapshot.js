import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'quantsoldier';
export const version = '1.0.0';

const DEFIAT_VOTING_POWER = {
  '1': '0x594AcA0b33B041b8d66D482daCCc7819feE45e0a'
};

const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address"
      }
    ],
    name: "myVotingPower",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];

export async function strategy(
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
    addresses.map((address: any) => [
      DEFIAT_VOTING_POWER[network],
      "myVotingPower",
      [address.toLowerCase()],
      { blockTag }
    ])
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals))
    ])
  );
}