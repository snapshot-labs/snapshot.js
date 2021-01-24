import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';
import { multicall } from '../../utils';

const KEEP_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/miracle2k/all-the-keeps'
};
const TokenStaking = {
  '1': "0x1293a54e160D1cd7075487898d65266081A15458"
};

export const author = 'corollari';
export const version = '0.1.1';

const abi = [
  {
    "constant": true,
    "inputs": [
      {
        "internalType": "address",
        "name": "_address",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  _options,
  snapshot
) {
  const params = {
    operators: {
      __args: {
        where: {
          owner_in: addresses.map((address) => address.toLowerCase())
        },
        first: 1000
      },
      address: true,
      owner: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.operators.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(KEEP_SUBGRAPH_URL[network], params);
  const score = {};
  if (result && result.operators) {
    const balances = await multicall(
      network,
      provider,
      abi,
      result.operators.map(op => [
        TokenStaking[network],
        'balanceOf',
        [op.address]
      ]),
      {
        blockTag: typeof snapshot === 'number' ? snapshot : 'latest'
      }
    )
    result.operators.forEach((op, i) => {
      const userAddress = getAddress(op.owner);
      if (!score[userAddress]) score[userAddress] = 0;
      score[userAddress] = score[userAddress] + Number(formatUnits(balances[i][0], 18));
    });
  }
  return score;
}
