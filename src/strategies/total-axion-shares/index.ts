import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'Axion Foundation';
export const version = '0.2.0';

const data_reader_address = "0x421456eFcEBf814975c8739CD613e5e7a954C474";
const data_reader_abi = [
  {
    name: "getDaoShares",
    stateMutability: "view",
    type: "function",
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    outputs: [
      {
        internalType: "uint256",
        name: "daoShares",
        type: "uint256"
      }
    ]
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