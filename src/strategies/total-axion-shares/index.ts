import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'Axion Foundation';
export const version = '0.2.0';

const data_reader_address = "0xeC870C24ff67173f33f9f1d6818987D767122807";
const data_reader_abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "getDaoShares",
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
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const totalShares = await multicall(
    network,
    provider,
    data_reader_abi,
    addresses.map((addr: String) => [
      data_reader_address, 
      'getDaoShares', 
      [addr]
    ]),
    { blockTag: snapshot }
  );

  const scores = {};
  const _1e18 = BigNumber.from("1000000000000000000");
  totalShares.forEach((v, i) => {
    const sharesBN = BigNumber.from(v.toString());
    scores[addresses[i]] = sharesBN.div(_1e18).toNumber();
  });

  return scores;
}