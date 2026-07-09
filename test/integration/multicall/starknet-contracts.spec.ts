// To run this test:
// npm test -- --run test/integration/multicall/starknet-contracts.spec.ts

import { describe, it, expect } from 'vitest';
import multicall from '../../../src/multicall/starknet';
import getProvider from '../../../src/utils/provider';

describe('Starknet multicall', () => {
  // Contract addresses
  const STAKING_DELEGATION_POOL =
    '0x02cb02c72e8a0975e69e88298443e984d965a49eab38f5bdde1f5072daa09cfe';

  const STARKNET_STAKING =
    '0x00ca1702e64c81d9a07b86bd2c540188d92a2c73cf5cc0e508d949015e7e84a7';

  // Multicall contract address for Starknet mainnet
  const MULTICALL_ADDRESS =
    '0x05754af3760f3356da99aea5c3ec39ccac7783d925a19666ebbeca58ff0087f4';

  // Input parameters
  const POOL_MEMBER_ADDRESS =
    '0x01c6a9f1f3f97a0a3b176fac97b69c3cd21ba31a522fca111b0e49e46975a048';

  const STAKER_ADDRESS =
    '0x00d3b910d8c528bf0216866053c3821ac6c97983dc096bff642e9a3549210ee7';

  // Initialize provider
  const provider = getProvider('0x534e5f4d41494e');

  /**
   * Contract ABI definitions for the functions we're calling
   */
  const contractAbi = [
    {
      name: 'identify',
      outputs: [{ type: 'core::felt252' }]
    },
    {
      name: 'get_pool_member_info_v1',
      outputs: [
        { type: 'core::starknet::contract_address::ContractAddress' }, // reward_address
        { type: 'core::integer::u256' }, // amount
        { type: 'core::integer::u256' }, // unclaimed_rewards
        { type: 'core::integer::u256' }, // commission
        { type: 'core::integer::u256' }, // unpool_amount
        { type: 'core::integer::u64' }, // unpool_time
        { type: 'core::integer::u8' } // status
      ]
    },
    {
      name: 'get_staker_info_v1',
      outputs: [
        { type: 'core::starknet::contract_address::ContractAddress' }, // reward_address
        { type: 'core::starknet::contract_address::ContractAddress' }, // operational_address
        { type: 'core::integer::u256' }, // unstake_time (u256)
        { type: 'core::integer::u256' }, // amount_own
        { type: 'core::integer::u256' }, // unclaimed_rewards_own
        { type: 'core::integer::u8' }, // pool_info variant (0x0 = None, 0x1 = Some)
        { type: 'core::starknet::contract_address::ContractAddress' }, // pool_contract
        { type: 'core::integer::u256' }, // pool amount
        { type: 'core::integer::u64' } // pool commission
      ]
    }
  ];

  it('should return responses from different contract calls', async () => {
    const calls = [
      // Call 1: identify() on Staking Delegation Pool
      [STAKING_DELEGATION_POOL, 'identify', []],

      // Call 2: get_pool_member_info_v1() on Staking Delegation Pool
      [
        STAKING_DELEGATION_POOL,
        'get_pool_member_info_v1',
        [POOL_MEMBER_ADDRESS]
      ],

      // Call 3: get_staker_info_v1() on Starknet Staking
      [STARKNET_STAKING, 'get_staker_info_v1', [STAKER_ADDRESS]]
    ];

    const results = await multicall(
      MULTICALL_ADDRESS,
      provider,
      contractAbi,
      calls,
      10,
      { blockTag: 1980732 }
    );

    expect(results).toMatchSnapshot();
  }, 30000);
});
