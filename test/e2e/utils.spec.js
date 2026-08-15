import { describe, test, expect } from 'vitest';
import {
  getEnsOwner,
  getEnsTextRecord,
  getShibariumNameOwner,
  getUDNameOwner,
  getSpaceController
} from '../../src/utils';
import { getViemClient } from '../../src/utils/viem';

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const ENS_UNIVERSAL_RESOLVER = '0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe';

describe('utils', () => {
  // See https://docs.ens.domains/web/ensv2-readiness/
  // 0x1111...1111 would mean resolution bypasses the Universal Resolver
  describe('ENSv2 readiness', () => {
    test('resolve names through the Universal Resolver', async () => {
      const client = getViemClient('1');
      await expect(
        client.getEnsAddress({
          name: 'ur.integration-tests.eth',
          universalResolverAddress: ENS_UNIVERSAL_RESOLVER
        })
      ).resolves.toBe('0x2222222222222222222222222222222222222222');
    });
  });

  describe('getEnsTextRecord', () => {
    test('return a text record through the Universal Resolver', async () => {
      await expect(getEnsTextRecord('ens.eth', 'avatar', '1')).resolves.toMatch(
        /^https?:\/\//
      );
    });

    test('return the snapshot record as legacy space uri', async () => {
      await expect(getEnsTextRecord('ens.eth', 'snapshot', '1')).resolves.toBe(
        'ipns://storage.snapshot.page/registry/0xb6E040C9ECAaE172a89bD561c5F73e1C48d28cd9/ens.eth'
      );
    });

    test('return the snapshot record', async () => {
      await expect(
        getEnsTextRecord('fabien.eth', 'snapshot', '1')
      ).resolves.toBe(
        'ipns://storage.snapshot.page/registry/0xeF8305E140ac520225DAf050e2f71d5fBcC543e7/fabien.eth'
      );
    });

    test('return the snapshot record as address', async () => {
      await expect(
        getEnsTextRecord('stakedao.eth', 'snapshot', '1')
      ).resolves.toBe('0xB0552b6860CE5C0202976Db056b5e3Cc4f9CC765');
    });

    test('forward block overrides to the resolver call', async () => {
      // the Universal Resolver is not deployed at this block, so a forwarded
      // blockNumber must fail where an ignored one would read latest
      await expect(
        getEnsTextRecord('ens.eth', 'snapshot', '1', {
          blockNumber: 10000000n
        })
      ).rejects.toThrow();
    });

    test('return null for an unset record', async () => {
      await expect(
        getEnsTextRecord('vitalik.eth', 'snapshot', '1')
      ).resolves.toBe(null);
    });

    test('return null for an unset record on testnet', async () => {
      await expect(
        getEnsTextRecord('ens.eth', 'snapshot', '11155111')
      ).resolves.toBe(null);
    });

    test('reject for unsupported networks', async () => {
      await expect(
        getEnsTextRecord('fabien.eth', 'snapshot', '100')
      ).rejects.toThrow('Network not supported');
    });
  });

  describe('getSpaceController', () => {
    test('return the controller address for mainnet', async () => {
      await expect(getSpaceController('psydao.eth', '1')).resolves.toBe(
        '0xF42b0Ec6ef1939EdEdBC369A3E660A276Afc88BD'
      );
    });

    test('return the controller from a snapshot record address', async () => {
      await expect(getSpaceController('stakedao.eth', '1')).resolves.toBe(
        '0xB0552b6860CE5C0202976Db056b5e3Cc4f9CC765'
      );
    });

    test('return the controller from a legacy space uri', async () => {
      await expect(getSpaceController('ens.eth', '1')).resolves.toBe(
        '0xb6E040C9ECAaE172a89bD561c5F73e1C48d28cd9'
      );
    });

    test('return the controller for aave.eth', async () => {
      await expect(getSpaceController('aave.eth', '1')).resolves.toBe(
        '0x60C8dC4762b217b4A00FF1824111077f331B1FbF'
      );
    });

    test('fall back to the name owner on testnet', async () => {
      await expect(getSpaceController('ens.eth', '11155111')).resolves.toBe(
        '0x179A862703a4adfb29896552DF9e307980D19285'
      );
    });

    test('fall back to the name owner on testnet for bob.eth', async () => {
      await expect(getSpaceController('bob.eth', '11155111')).resolves.toBe(
        '0x179A862703a4adfb29896552DF9e307980D19285'
      );
    });

    test('resolve a name the DNS wire format cannot carry', async () => {
      await expect(
        getSpaceController('🧛🏻‍♂🧛🏻‍♂🧛🏻‍♂🧛🏻‍♂🧛🏻‍♂🧛🏻‍♂.eth', '1')
      ).resolves.toBe('0x1900c042Ce71f8384e19B207B6cd155dD069E3EC');
    });

    test('resolve an ENSv2 name owner on testnet via findOwner', async () => {
      await expect(getSpaceController('test123.eth', '11155111')).resolves.toBe(
        '0x1208a26FAa0F4AC65B42098419EB4dAA5e580AC6'
      );
    });

    test('return an empty address on testnet for a non-existent name', async () => {
      await expect(
        getSpaceController('snapshotdoesnotexist123.eth', '11155111')
      ).resolves.toBe(EMPTY_ADDRESS);
    });

    test('resolve a live testnet space controller', async () => {
      await expect(getSpaceController('boorger.eth', '11155111')).resolves.toBe(
        '0x220bc93D88C0aF11f1159eA89a885d5ADd3A7Cf6'
      );
    });

    test('resolve another live testnet space controller', async () => {
      await expect(getSpaceController('demodao.eth', '11155111')).resolves.toBe(
        '0x51c3b2EC4B010e57058891AF2b068E0b0F96d07b'
      );
    });
  });
  describe('getEnsOwner', () => {
    describe('onchain resolver', () => {
      test('return an address for mainnet', async () => {
        await expect(getEnsOwner('shot.eth', '1')).resolves.toBe(
          '0x8C28Cf33d9Fd3D0293f963b1cd27e3FF422B425c'
        );
      });

      test('return an address for sepolia', async () => {
        await expect(getEnsOwner('ens.eth', '11155111')).resolves.toBe(
          '0x179A862703a4adfb29896552DF9e307980D19285'
        );
      });

      test('return an address for subdomain', async () => {
        await expect(getEnsOwner('2.snapspace.eth')).resolves.toBe(
          '0x24F15402C6Bb870554489b2fd2049A85d75B982f'
        );
      });

      test('return an address for other TLD', async () => {
        await expect(getEnsOwner('worldlibertyfinancial.com')).resolves.toBe(
          '0x407F66Afb4f9876637AcCC3246099a2f9705c178'
        );
      });

      test('return an empty address for non-existent subdomain', async () => {
        await expect(getEnsOwner('2arst.snapspace.eth')).resolves.toBe(
          EMPTY_ADDRESS
        );
      });
    });

    describe('offchain resolver', () => {
      test('return an address for coinbase resolver', async () => {
        await expect(getEnsOwner('lucemans.cb.id')).resolves.toBe(
          '0x4e7abb71BEe38011c54c30D0130c0c71Da09222b'
        );
      });

      test('return an address for uniswap resolver', async () => {
        await expect(getEnsOwner('lucemans.uni.eth')).resolves.toBe(
          '0x225f137127d9067788314bc7fcc1f36746a3c3B5'
        );
      });

      test('return an empty address when no result from resolver on mainnet', async () => {
        await expect(getEnsOwner('notfounddomain.uni.eth')).resolves.toBe(
          EMPTY_ADDRESS
        );
      });

      test('return an empty address when no result from resolver on testnet', async () => {
        await expect(
          getEnsOwner('notfounddomain.uni.eth', '11155111')
        ).resolves.toBe(EMPTY_ADDRESS);
      });
    });

    describe('offchain DNS resolver', () => {
      test('return an address for claimed domain', async () => {
        await expect(getEnsOwner('defi.app')).resolves.toBe(
          '0x7aeB96261e9dC2C9f01BaE6A516Df80a5a98c7eB'
        );
      });

      test('return an empty address for unclaimed domain', async () => {
        await expect(getEnsOwner('google.com')).resolves.toBe(EMPTY_ADDRESS);
      });
    });

    describe('shibarium resolver', () => {
      test('return an empty address for unrecognized extension', async () => {
        await expect(
          getShibariumNameOwner('invalid.domain', '109')
        ).resolves.toBe(EMPTY_ADDRESS);
      });

      test('return the name owner on mainnet', async () => {
        await expect(
          getShibariumNameOwner('boorger.shib', '109')
        ).resolves.toBe('0x220bc93D88C0aF11f1159eA89a885d5ADd3A7Cf6');
      });
    });

    describe('sonic resolver', () => {
      test('return an empty address for unrecognized extension', async () => {
        await expect(getUDNameOwner('invalid.domain', '146')).resolves.toBe(
          EMPTY_ADDRESS
        );
      });

      test('return an empty address for un-existing domain', async () => {
        await expect(
          getUDNameOwner('snapshot-not-exist.sonic', '146')
        ).resolves.toBe(EMPTY_ADDRESS);
      });

      test('return the name owner on sonic mainnet', async () => {
        await expect(getUDNameOwner('boorger.sonic', '146')).resolves.toBe(
          '0x220bc93D88C0aF11f1159eA89a885d5ADd3A7Cf6'
        );
      });
    });
  });
});
