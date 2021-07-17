import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'ayush-jibrel';
export const version = '0.1.0';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'stakingDetails',
    outputs: [
      {
        internalType: 'uint256',
        name: 'startTime',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'endTime',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'reward',
        type: 'uint256'
      },
      {
        internalType: 'uint8',
        name: 'durationIndex',
        type: 'uint8'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'stakeCounter',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
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

  const counters = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.address,
      'stakeCounter',
      [address]
    ]),
    { blockTag }
  );

  const userAddresses: string[] = [];

  const calls = () => {
    let callsArr: [any, string, [any, any]][] = [];
    addresses.map((address, i) => {
      for (
        let j = 1;
        j <= parseFloat(formatUnits(counters[i].toString(), 0));
        j++
      ) {
        userAddresses.push(address);
        callsArr = [
          ...callsArr,
          [options.address, 'stakingDetails', [address, j]]
        ];
      }
    });
    return callsArr;
  };

  const response = await multicall(network, provider, abi, calls(), {
    blockTag
  });

  const result = response.reduce((acc, cur, i) => {
    if (acc[userAddresses[i]]) {
      acc[userAddresses[i]] += parseFloat(
        formatUnits(cur.amount.toString(), options.decimals)
      );
    } else {
      acc[userAddresses[i]] = parseFloat(
        formatUnits(cur.amount.toString(), options.decimals)
      );
    }
    return acc;
  }, {});

  return result;
}
