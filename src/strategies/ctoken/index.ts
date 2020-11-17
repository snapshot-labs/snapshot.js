import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'arr00';
export const version = '0.1.0';

const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
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
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'borrowBalanceStored',
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
  const oldBlockTag =
    typeof snapshot === 'number'
      ? snapshot - options.offsetCheck
      : (await provider.getBlockNumber()) - options.offsetCheck;

  let balanceOfCalls = addresses.map((address: any) => [
    options.address,
    'balanceOf',
    [address]
  ]);
  let borrowBalanceCalls = addresses.map((address: any) => [
    options.address,
    'borrowBalanceStored',
    [address]
  ]);
  let calls = balanceOfCalls.concat(borrowBalanceCalls);

  const [response, balancesOldResponse] = await Promise.all([
    multicall(network, provider, abi, calls, { blockTag }),
    multicall(
      network,
      provider,
      abi,
      addresses.map((address: any) => [
        options.address,
        'balanceOf',
        [address]
      ]),
      { blockTag: oldBlockTag }
    )
  ]);

  const balancesNowResponse = response.slice(0, addresses.length);
  const borrowsNowResponse = response.slice(addresses.length);

  let resultData = {};
  for (let i = 0; i < balancesNowResponse.length; i++) {
    let noBorrow = 1;
    if (options.borrowingRestricted) {
      noBorrow =
        borrowsNowResponse[i].toString().localeCompare('0') == 0 ? 1 : 0;
    }
    const balanceNow = parseFloat(
      formatUnits(balancesNowResponse[i].toString(), options.decimals)
    );
    const balanceOld = parseFloat(
      formatUnits(balancesOldResponse[i].toString(), options.decimals)
    );
    resultData[addresses[i]] = Math.min(balanceNow, balanceOld) * noBorrow;
  }
  return resultData;
}
