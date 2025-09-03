// To run this test:
// npm test -- --run test/integration/multicall/starknet-contracts.spec.ts

import { describe, it, expect } from 'vitest';
import { RpcProvider } from 'starknet';
import multicall from '../../../src/multicall/starknet';

describe('Starknet Contract Reader Integration', () => {
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
  const provider = new RpcProvider({
    nodeUrl: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7'
  });

  /**
   * Format contract response data with proper JSON formatting
   */
  function formatOutput(title: string, data: any): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${title}`);
    console.log(`${'='.repeat(60)}`);

    if (typeof data === 'object' && data !== null) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }

    console.log(`${'='.repeat(60)}\n`);
  }

  /**
   * Convert hex response to readable format
   */
  function convertHexToString(hexValue: string): string {
    if (typeof hexValue === 'string' && hexValue.startsWith('0x')) {
      try {
        const hex = hexValue.slice(2);
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          const charCode = parseInt(hex.substr(i, 2), 16);
          if (charCode > 0) {
            str += String.fromCharCode(charCode);
          }
        }
        return str || hexValue;
      } catch (e) {
        return hexValue;
      }
    }
    return hexValue;
  }

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
        { type: 'core::integer::u64' }, // unstake_time
        { type: 'core::integer::u8' }, // amount_own
        { type: 'core::integer::u256' }, // amount_delegated
        { type: 'core::integer::u256' }, // unclaimed_rewards_own
        { type: 'core::integer::u64' }, // commission
        { type: 'core::starknet::contract_address::ContractAddress' }, // pool_contract
        { type: 'core::integer::u256' }, // unclaimed_rewards_delegated
        { type: 'core::integer::u64' } // switch_pool_time
      ]
    }
  ];

  it('should call identify, get_pool_member_info_v1, and get_staker_info_v1 using multicall', async () => {
    console.log('\n🚀 Starting Starknet Contract Reader with Multicall...\n');
    console.log('📊 Contract Information:');
    console.log(`   • Multicall Contract:      ${MULTICALL_ADDRESS}`);
    console.log(`   • Staking Delegation Pool: ${STAKING_DELEGATION_POOL}`);
    console.log(`   • Starknet Staking:        ${STARKNET_STAKING}`);
    console.log(`   • Pool Member Address:     ${POOL_MEMBER_ADDRESS}`);
    console.log(`   • Staker Address:          ${STAKER_ADDRESS}\n`);

    // Prepare multicall calls
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

    // Execute multicall
    console.log('🔄 Executing multicall...\n');
    const results = await multicall(
      MULTICALL_ADDRESS,
      provider,
      contractAbi,
      calls,
      10 // batch limit
    );

    // Validate that we got results
    expect(results).toBeDefined();
    expect(results).toHaveLength(3);

    // Process results
    const [identifyResult, poolMemberInfoResult, stakerInfoResult] = results;

    // Validate identify result
    expect(identifyResult).toBeDefined();
    expect(identifyResult.length).toBeGreaterThan(0);

    // Format identify result
    const identityString = convertHexToString(identifyResult[0]);
    formatOutput('🔍 STAKING DELEGATION POOL - IDENTIFY', {
      contract: STAKING_DELEGATION_POOL,
      function: 'identify()',
      raw_response: identifyResult[0],
      decoded_response: identityString,
      timestamp: new Date().toISOString()
    });

    // Validate pool member info result
    expect(poolMemberInfoResult).toBeDefined();
    expect(poolMemberInfoResult.length).toBeGreaterThanOrEqual(6);

    // Format pool member info result
    formatOutput('👥 STAKING DELEGATION POOL - MEMBER INFO', {
      contract: STAKING_DELEGATION_POOL,
      function: 'get_pool_member_info_v1(member_address)',
      input: {
        member_address: POOL_MEMBER_ADDRESS
      },
      response: {
        reward_address: poolMemberInfoResult[0] || '0x0',
        amount: poolMemberInfoResult[1]?.toString() || '0x0',
        unclaimed_rewards: poolMemberInfoResult[2]?.toString() || '0x0',
        commission: poolMemberInfoResult[3]?.toString() || '0x0',
        unpool_amount: poolMemberInfoResult[4]?.toString() || '0x0',
        unpool_time: poolMemberInfoResult[5] || 0,
        status: poolMemberInfoResult[6] || 0
      },
      timestamp: new Date().toISOString()
    });

    // Validate staker info result
    expect(stakerInfoResult).toBeDefined();
    expect(stakerInfoResult.length).toBeGreaterThanOrEqual(5);

    // Format staker info result
    formatOutput('🏛️  STARKNET STAKING - STAKER INFO', {
      contract: STARKNET_STAKING,
      function: 'get_staker_info_v1(staker_address)',
      input: {
        staker_address: STAKER_ADDRESS
      },
      response: {
        staker_address: STAKER_ADDRESS,
        reward_address: stakerInfoResult[0] || '0x0',
        operational_address: stakerInfoResult[1] || '0x0',
        unstake_time: stakerInfoResult[2] || 0,
        amount_own: stakerInfoResult[3] || 0,
        amount_delegated: stakerInfoResult[4]?.toString() || '0x0',
        unclaimed_rewards_own: stakerInfoResult[5]?.toString() || '0x0',
        commission: stakerInfoResult[6] || 0,
        pool_contract: stakerInfoResult[7] || '0x0',
        unclaimed_rewards_delegated: stakerInfoResult[8]?.toString() || '0x0',
        switch_pool_time: stakerInfoResult[9] || 0
      },
      timestamp: new Date().toISOString()
    });

    // Summary
    console.log('\n📋 EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ identify(): ${identifyResult ? 'SUCCESS' : 'FAILED'}`);
    console.log(
      `✅ get_pool_member_info_v1(): ${
        poolMemberInfoResult ? 'SUCCESS' : 'FAILED'
      }`
    );
    console.log(
      `✅ get_staker_info_v1(): ${stakerInfoResult ? 'SUCCESS' : 'FAILED'}`
    );
    console.log('='.repeat(60));
    console.log(
      '\n🎉 All contract calls completed successfully via multicall!'
    );

    // Final assertions
    expect(identityString).toBe('Staking Delegation Pool');
    expect(poolMemberInfoResult[0]).toBeDefined(); // reward_address exists
    expect(stakerInfoResult[0]).toBeDefined(); // reward_address exists
  }, 30000); // 30 second timeout for network calls
});
