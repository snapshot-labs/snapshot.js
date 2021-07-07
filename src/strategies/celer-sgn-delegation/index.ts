import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

import { multicall } from '../../utils';

export const author = 'dominator008';
export const version = '0.1.0';

const abi = [
  {
    constant: true,
    inputs: [],
    name: 'getValidatorNum',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'validatorSet',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },

  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: '_candidateAddr',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_delegatorAddr',
        type: 'address'
      }
    ],
    name: 'getDelegatorInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'delegatedStake',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'undelegatingStake',
        type: 'uint256'
      },
      {
        internalType: 'uint256[]',
        name: 'intentAmounts',
        type: 'uint256[]'
      },
      {
        internalType: 'uint256[]',
        name: 'intentProposedTimes',
        type: 'uint256[]'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // 1. Get the number of validators
  const validatorNum: BigNumber = (
    await multicall(
      network,
      provider,
      abi,
      [[options.dposAddress, 'getValidatorNum', []]],
      { blockTag }
    )
  )[0][0];

  // 2. Get the addresses of the validators
  const validatorAddresses: string[] = (
    await multicall(
      network,
      provider,
      abi,
      Array.from(Array(validatorNum.toNumber()).keys()).map((index: number) => [
        options.dposAddress,
        'validatorSet',
        [index]
      ]),
      { blockTag }
    )
  ).map((value: string[]) => value[0]);

  // 2. Get the delegation of all addresses to all validators
  const callInfos = validatorAddresses.reduce<any[]>(
    (infos, validatorAddress, _) =>
      infos.concat(
        addresses.map((address: string) => [
          address,
          [options.dposAddress, 'getDelegatorInfo', [validatorAddress, address]]
        ])
      ),
    []
  );
  const callInfosCopy = [...callInfos];
  const batchSize = 2000;
  const batches = new Array(Math.ceil(callInfos.length / batchSize))
    .fill(0)
    .map((_) => callInfosCopy.splice(0, batchSize));
  let delegatorInfoResponse: any[] = [];
  for (let i = 0; i < batches.length; i++) {
    delegatorInfoResponse = delegatorInfoResponse.concat(
      await multicall(
        network,
        provider,
        abi,
        batches[i].map((info) => info[1]),
        { blockTag }
      )
    );
  }

  // 3. For each address, aggregate the delegations to each validator
  const delegations = delegatorInfoResponse.map((info, i) => [
    callInfos[i][0],
    info.delegatedStake
  ]);
  const aggregatedDelegations = delegations.reduce(
    (aggregates, delegation, _) => {
      const delegatorAddress = delegation[0];
      if (aggregates[delegatorAddress]) {
        aggregates[delegatorAddress] = aggregates[delegatorAddress].add(
          delegation[1]
        );
      } else {
        aggregates[delegatorAddress] = delegation[1];
      }
      return aggregates;
    },
    {}
  );
  return Object.entries<BigNumber>(aggregatedDelegations).reduce(
    (transformed, [delegatorAddress, delegatedStake], _) => {
      transformed[delegatorAddress] = parseFloat(
        formatUnits(delegatedStake.toString(), 18)
      );
      return transformed;
    },
    {}
  );
}
