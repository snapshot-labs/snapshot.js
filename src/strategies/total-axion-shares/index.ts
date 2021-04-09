import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'Jordan Travaux';
export const version = '0.1.2';

const _1e18 = '1000000000000000000';
const staking_v2 = '0x1920d646574E097c2c487F69F40814F95d45bf8C';
const staking_v1 = '0xcfd53eff4871b93ed7405f3f428c25f3bf60bbea';

const abi_v2 = [
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' }
    ],
    name: 'sessionDataOf',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'start',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'end',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'shares',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'firstPayout',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'lastPayout',
        type: 'uint256'
      },
      {
        internalType: 'bool',
        name: 'withdrawn',
        type: 'bool'
      },
      {
        internalType: 'uint256',
        name: 'payout',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'sessionsOf_',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const abi_v1 = [
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' }
    ],
    name: 'sessionDataOf',
    outputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'start', type: 'uint256' },
      { internalType: 'uint256', name: 'end', type: 'uint256' },
      { internalType: 'uint256', name: 'shares', type: 'uint256' },
      { internalType: 'uint256', name: 'nextPayout', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const getSessionIDs = async (
  network,
  provider,
  addresses,
  snapshot,
  version = 'v2'
) => {
  let stakingContract = version === 'v2' ? staking_v2 : staking_v1;

  const result = await multicall(
    network,
    provider,
    abi_v2,
    addresses.map((address: any) => [
      stakingContract,
      'sessionsOf_',
      [address]
    ]),
    { blockTag: snapshot }
  );

  const sessionsByAddr = Object.fromEntries(
    result.map((value, i) => [addresses[i], value.toString().split(',')])
  );

  const sessionIDLookup: any[] = [];
  Object.keys(sessionsByAddr).map((addr) => {
    const sessions = sessionsByAddr[addr];
    sessions.forEach((s) => {
      if (s) sessionIDLookup.push({ session: s, address: addr });
    });
  });

  return sessionIDLookup;
};

const getTotalSharesByAddress = async (
  network,
  provider,
  sessionLookups,
  version,
  options
) => {
  let stakingContract = version === 'v2' ? staking_v2 : staking_v1;
  let abi = version === 'v2' ? abi_v2 : abi_v1;

  const sessionInfo = await multicall(
    network,
    provider,
    abi,
    sessionLookups.map((s) => [
      stakingContract,
      'sessionDataOf',
      [s.address, s.session]
    ])
  );

  const addressAmounts = {};
  sessionInfo.forEach((si, i) => {
    const length = Math.floor((si.end - si.start) / 86400);
    const minDays = options.days || 350;
    if (length >= minDays) {
      const address = sessionLookups[i].address;
      let amount = si.withdrawn ? BigNumber.from(0) : si.shares;

      if (version === 'v1')
        amount = si.shares.isZero() ? BigNumber.from(0) : si.shares;

      if (!addressAmounts[address]) addressAmounts[address] = [amount];
      else addressAmounts[address].push(amount);
    }
  });

  const totalAxnByAddress = Object.fromEntries(
    Object.keys(addressAmounts).map((addr) => [
      addr,
      addressAmounts[addr]
        .reduce((acc, curr) => acc.add(curr))
        .div(_1e18)
        .toNumber()
    ])
  );

  return totalAxnByAddress;
};

const combineV1V2 = (v1, v2) => {
  const totals = {};
  const addrs_v1 = Object.keys(v1);
  for (let i = 0; i < addrs_v1.length; ++i) {
    const addr = addrs_v1[i];
    if (!totals[addr]) totals[addr] = [v1[addr]];
    else totals[addr].push(v1[addr]);
  }

  const addrs_v2 = Object.keys(v2);
  for (let i = 0; i < addrs_v2.length; ++i) {
    const addr = addrs_v2[i];
    if (!totals[addr]) totals[addr] = [v2[addr]];
    else totals[addr].push(v2[addr]);
  }

  return totals;
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // Get all sessionID's per address
  const [sessionIDLookupV2, sessionIDLookupV1] = await Promise.all([
    getSessionIDs(network, provider, addresses, snapshot, 'v2'),
    getSessionIDs(network, provider, addresses, snapshot, 'v1')
  ]);

  const totalSharesByAddressV2 = await getTotalSharesByAddress(
    network,
    provider,
    sessionIDLookupV2,
    'v2',
    options
  );

  // Remove v2 sessionID's from v1 array
  const fixedV1Sessions: any[] = [];
  sessionIDLookupV1.forEach((s) => {
    if (!sessionIDLookupV2.find((v) => v.session == s.session))
      fixedV1Sessions.push(s);
  });

  const totalSharesByAddressV1 = await getTotalSharesByAddress(
    network,
    provider,
    fixedV1Sessions,
    'v1',
    options
  );
  const combined = combineV1V2(totalSharesByAddressV1, totalSharesByAddressV2);

  // Add up v1 and v2 stakes
  const toalShares = {};
  for (const a in combined)
    toalShares[a] = combined[a].reduce((acc, curr) => acc + curr, 0);

  // Set addresses with no data/shares to 0.
  addresses.forEach((a) => {
    if (!toalShares[a]) toalShares[a] = 0;
  });

  return toalShares;
}
