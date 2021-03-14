import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'Jordan Travaux';
export const version = '0.1.0';

const abi_v2 = [
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "sessionDataOf",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "start",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "firstPayout",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "lastPayout",
        type: "uint256"
      },
      {
        internalType: "bool",
        name: "withdrawn",
        type: "bool"
      },
      {
        internalType: "uint256",
        name: "payout",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "sessionsOf_",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
];

const abi_v1 = [
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    name: "sessionDataOf",
    outputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "start", type: "uint256" },
      { internalType: "uint256", name: "end", type: "uint256" },
      { internalType: "uint256", name: "shares", type: "uint256" },
      { internalType: "uint256", name: "nextPayout", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
];

const _1e18 = "1000000000000000000";

const getSessionIDs = async (network, provider, addresses, snapshot, version = "v2") => {
  let stakingContract = version === "v2" ? "0x1920d646574E097c2c487F69F40814F95d45bf8C" : "0xcfd53eff4871b93ed7405f3f428c25f3bf60bbea"

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
  )

  const sessionsByAddr = Object.fromEntries(
    result.map((value, i) => [
      addresses[i],
      value.toString().split(",")
    ])
  );

  const sessionIDLookup = [];
  Object.keys(sessionsByAddr).map(addr => {
    const sessions = sessionsByAddr[addr];
    sessions.forEach(s => {
      if (s)
        sessionIDLookup.push({ session: s, address: addr })
    })
  })

  return sessionIDLookup;
}

const getTotalStakedAxnByAddress = async (network, provider, sessionLookups, version = "v2") => {
  let stakingContract = version === "v2" ? "0x1920d646574E097c2c487F69F40814F95d45bf8C" : "0xcfd53eff4871b93ed7405f3f428c25f3bf60bbea"
  let abi = version === "v2" ? abi_v2 : abi_v1;

  const sessionInfo = await multicall(
    network,
    provider,
    abi,
    sessionLookups.map(s => [
      stakingContract,
      'sessionDataOf',
      [s.address, s.session]
    ])
  );

  const addressAmounts = {};
  sessionInfo.forEach((si, i) => {
    const address = sessionLookups[i].address;
    let amount = si.withdrawn ? BigNumber.from(0) : si.amount;

    if (version === "v1")
      amount = si.shares.isZero() ? BigNumber.from(0) : si.amount;

    if (!addressAmounts[address])
      addressAmounts[address] = [amount]
    else
      addressAmounts[address].push(amount)
  })

  const totalAxnByAddress = Object.fromEntries(
    Object.keys(addressAmounts).map(addr => [
      addr,
      addressAmounts[addr].reduce((acc, curr) => acc.add(curr)).div(_1e18).toNumber()
    ])
  )

  return totalAxnByAddress;
}

const combineV1V2 = (v1, v2) => {
  const totals = {}
  const addrs_v1 = Object.keys(v1);
  for (let i = 0; i < addrs_v1.length; ++i) {
    const addr = addrs_v1[i];
    if (!totals[addr])
      totals[addr] = [v1[addr]]
    else
      totals[addr].push(v1[addr])
  }

  const addrs_v2 = Object.keys(v2);
  for (let i = 0; i < addrs_v2.length; ++i) {
    const addr = addrs_v2[i];
    if (!totals[addr])
      totals[addr] = [v2[addr]]
    else
      totals[addr].push(v2[addr])
  }

  return totals;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // Get Liquid Axion
  const liquidAxionAtBlock = await erc20BalanceOfStrategy(space, network, provider, addresses, options, snapshot);

  // Get all sessionID's per address
  const sessionIDLookupV2 = await getSessionIDs(network, provider, addresses, snapshot, "v2");
  const totalAxnByAddressV2 = await getTotalStakedAxnByAddress(network, provider, sessionIDLookupV2, "v2");
  const sessionIDLookupV1 = await getSessionIDs(network, provider, addresses, snapshot, "v1");

  // Remove v2 sessionID's from v1 array
  const fixedV1Sessions = [];
  sessionIDLookupV1.forEach(s => {
    if (!sessionIDLookupV2.find(v => v.session == s.session))
      fixedV1Sessions.push(s)
  })

  const totalAxnByAddressV1 = await getTotalStakedAxnByAddress(network, provider, fixedV1Sessions, "v1")
  const combined = combineV1V2(totalAxnByAddressV1, totalAxnByAddressV2)

  // Add up v1 and v2 stakes
  const toalAxnStaked = {};
  for (const a in combined)
    toalAxnStaked[a] = combined[a].reduce((acc, curr) => acc + curr, 0)

  // Add up liquid + staked
  const toalAxn = {};
  for (const key in liquidAxionAtBlock) {
    const liquid = Math.floor(liquidAxionAtBlock[key])
    const staked = toalAxnStaked[key];

    if (staked)
      toalAxn[key] = liquid + staked
    else
      toalAxn[key] = liquid
  }

  return toalAxn;
}