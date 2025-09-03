// To run this test:
// npm test -- --run test/integration/multicall/starknet-contracts.spec.ts

import { describe, it, expect } from 'vitest';
import multicall from '../../../src/multicall/starknet';
import getProvider from '../../../src/utils/provider';

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
  const provider = getProvider('0x534e5f4d41494e');

  /**
   * Format contract response data with proper JSON formatting
   */
  function formatOutput(data: any): void {
    if (typeof data === 'object' && data !== null) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
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

  it('should call identify, get_pool_member_info_v1, and get_staker_info_v1 using multicall', async () => {
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

    expect(results).toBeDefined();
    expect(results).toHaveLength(3);

    const [identifyResult, poolMemberInfoResult, stakerInfoResult] = results;

    expect(identifyResult).toBeDefined();
    expect(identifyResult.length).toBeGreaterThan(0);

    const identityString = convertHexToString(identifyResult[0]);
    formatOutput({
      contract: STAKING_DELEGATION_POOL,
      function: 'identify()',
      raw_response: identifyResult[0],
      decoded_response: identityString,
      timestamp: new Date().toISOString()
    });
    expect(identifyResult[0]).toBeDefined();
    expect(identifyResult[0]).toBe('Staking Delegation Pool');

    const poolMemberInfoResponse = {
      reward_address: poolMemberInfoResult[1] || '0x0',
      amount: poolMemberInfoResult[2]?.toString() || '0x0',
      unclaimed_rewards: poolMemberInfoResult[3]?.toString() || '0x0',
      commission: poolMemberInfoResult[4]?.toString() || '0x0',
      unpool_amount: poolMemberInfoResult[5]?.toString() || '0x0',
      unpool_time: poolMemberInfoResult[6] || '0x0'
    };
    formatOutput({
      contract: STAKING_DELEGATION_POOL,
      function: 'get_pool_member_info_v1(member_address)',
      input: {
        member_address: POOL_MEMBER_ADDRESS
      },
      response: poolMemberInfoResponse,
      timestamp: new Date().toISOString()
    });

    expect(poolMemberInfoResponse).toBeDefined();
    expect(poolMemberInfoResponse).toMatchObject({
      reward_address:
        '0x1c6a9f1f3f97a0a3b176fac97b69c3cd21ba31a522fca111b0e49e46975a048',
      amount: '0x29fa8220372487cb4e1',
      unclaimed_rewards: '0x41a4db19d798c5601b',
      commission: '0x0',
      unpool_amount: '0x0',
      unpool_time: '0x1'
    });

    const stakerInfoResponse = {
      reward_address: stakerInfoResult[1] || '0x0',
      operational_address: stakerInfoResult[2] || '0x0',
      unstake_time: stakerInfoResult[3]?.toString() || '0x0',
      amount_own: stakerInfoResult[4]?.toString() || '0x0',
      unclaimed_rewards_own: stakerInfoResult[5]?.toString() || '0x0',
      pool_info: {
        pool_contract: stakerInfoResult[7],
        amount: stakerInfoResult[8]?.toString() || '0x0',
        commission: stakerInfoResult[9] || '0x0'
      }
    };

    // Format staker info result
    formatOutput({
      contract: STARKNET_STAKING,
      function: 'get_staker_info_v1(staker_address)',
      input: {
        staker_address: STAKER_ADDRESS
      },
      response: stakerInfoResponse,
      timestamp: new Date().toISOString()
    });

    expect(stakerInfoResponse).toBeDefined();
    expect(stakerInfoResponse).toStrictEqual({
      reward_address:
        '0xd3b910d8c528bf0216866053c3821ac6c97983dc096bff642e9a3549210ee7',
      operational_address:
        '0x6012516a3ae0e8e8367abdb1db76ba56f7cb221aa3c1e4c02f52ab9d4d1ebc6',
      unstake_time: '0x1',
      amount_own: '0x175a7be10a64c27440000',
      unclaimed_rewards_own: '0x24bbe83f0dac46c56c50',
      pool_info: {
        pool_contract:
          '0x2cb02c72e8a0975e69e88298443e984d965a49eab38f5bdde1f5072daa09cfe',
        amount: '0x4054bc140aecf17b7b7c48',
        commission: '0x0'
      }
    });
  }, 30000);
});
