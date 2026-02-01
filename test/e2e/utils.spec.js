import { describe, test, expect } from 'vitest';
import {
  getEnsOwner,
  getShibariumNameOwner,
  getUDNameOwner,
  getSpaceController
} from '../../src/utils';

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('utils', () => {
  describe('getSpaceController', () => {
    test('return the controller address for mainnet', () => {
      expect(getSpaceController('psydao.eth', '1')).resolves.toBe(
        '0xF42b0Ec6ef1939EdEdBC369A3E660A276Afc88BD'
      );
    });
  });
  describe('getEnsOwner', () => {
    describe('onchain resolver', () => {
      test('return an address for mainnet', () => {
        expect(getEnsOwner('shot.eth', '1')).resolves.toBe(
          '0x8C28Cf33d9Fd3D0293f963b1cd27e3FF422B425c'
        );
      });

      test('return an address for sepolia', () => {
        expect(getEnsOwner('snapshot.eth', '11155111')).resolves.toBe(
          '0x8C28Cf33d9Fd3D0293f963b1cd27e3FF422B425c'
        );
      });

      test('return an address for subdomain', () => {
        expect(getEnsOwner('2.snapspace.eth')).resolves.toBe(
          '0x24F15402C6Bb870554489b2fd2049A85d75B982f'
        );
      });

      test('return an address for other TLD', () => {
        expect(getEnsOwner('worldlibertyfinancial.com')).resolves.toBe(
          '0x407F66Afb4f9876637AcCC3246099a2f9705c178'
        );
      });

      test('return an empty address for non-existent subdomain', () => {
        expect(getEnsOwner('2arst.snapspace.eth')).resolves.toBe(EMPTY_ADDRESS);
      });
    });

    describe('offchain resolver', () => {
      test('return an address for coinbase resolver', () => {
        expect(getEnsOwner('lucemans.cb.id')).resolves.toBe(
          '0x4e7abb71BEe38011c54c30D0130c0c71Da09222b'
        );
      });

      test('return an address for uniswap resolver', () => {
        expect(getEnsOwner('lucemans.uni.eth')).resolves.toBe(
          '0x225f137127d9067788314bc7fcc1f36746a3c3B5'
        );
      });

      test('return an empty address when no result from resolver on mainnet', () => {
        expect(getEnsOwner('notfounddomain.uni.eth')).resolves.toBe(
          EMPTY_ADDRESS
        );
      });

      test('return an empty address when no result from resolver on testnet', () => {
        expect(getEnsOwner('notfounddomain.uni.eth', '11155111')).resolves.toBe(
          EMPTY_ADDRESS
        );
      });
    });

    describe('offchain DNS resolver', () => {
      test('return an address for claimed domain', () => {
        expect(getEnsOwner('defi.app')).resolves.toBe(
          '0x7aeB96261e9dC2C9f01BaE6A516Df80a5a98c7eB'
        );
      });

      test('return an empty address for unclaimed domain', () => {
        expect(getEnsOwner('google.com')).resolves.toBe(EMPTY_ADDRESS);
      });
    });

    describe('shibarium resolver', () => {
      test('return an empty address for unrecognized extension', () => {
        expect(getShibariumNameOwner('invalid.domain', '109')).resolves.toBe(
          EMPTY_ADDRESS
        );
      });

      test('return the name owner on mainnet', () => {
        expect(getShibariumNameOwner('boorger.shib', '109')).resolves.toBe(
          '0x220bc93D88C0aF11f1159eA89a885d5ADd3A7Cf6'
        );
      });
    });

    describe('sonic resolver', () => {
      test('return an empty address for unrecognized extension', () => {
        expect(getUDNameOwner('invalid.domain', '146')).resolves.toBe(
          EMPTY_ADDRESS
        );
      });

      test('return an empty address for un-existing domain', () => {
        expect(getUDNameOwner('snapshot-not-exist.sonic', '146')).resolves.toBe(
          EMPTY_ADDRESS
        );
      });

      test('return the name owner on sonic mainnet', () => {
        expect(getUDNameOwner('boorger.sonic', '146')).resolves.toBe(
          '0x220bc93D88C0aF11f1159eA89a885d5ADd3A7Cf6'
        );
      });
    });
  });
});
