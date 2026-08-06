import { describe, it, expect } from 'vitest';
import { CallData, starknetId } from 'starknet';
import Multicaller from '../../../src/multicall/multicaller';
import getProvider from '../../../src/utils/provider';

describe('Starknet.id through Multicaller', () => {
  const network = '0x534e5f4d41494e';
  const provider = getProvider(network);

  const NAMING_CONTRACT =
    '0x6ac597f8116f886fa1c97a23fa4e08299975ecaf6b598873ca6792b9bbfb678';

  const namingAbi = [
    {
      name: 'address_to_domain',
      outputs: [{ type: 'core::array::Span::<core::felt252>' }]
    },
    {
      name: 'domain_to_address',
      outputs: [{ type: 'core::starknet::contract_address::ContractAddress' }]
    }
  ];

  const domains = {
    'checkpoint.stark':
      '0x7ff6b17f07c4d83236e3fc5f94259a19d1ed41bbcf1822397ea17882e9b038d',
    'fricoben.stark':
      '0x61b6c0a78f9edf13cea17b50719f3344533fadd470b8cb29c2b4318014f52d3',
    'th0rgal.stark':
      '0xa00373a00352aa367058555149b573322910d54fcdf3a926e3e56d0dcb4b0c'
  };

  const addressWithoutDomain =
    '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde';

  const options = { limit: 50, blockTag: 12716771 };

  it('should look up the domains of a batch of addresses', async () => {
    const addresses = [...Object.values(domains), addressWithoutDomain];
    const multicaller = new Multicaller(network, provider, namingAbi, options);

    addresses.forEach((address) => {
      multicaller.call(
        ['domains', address],
        NAMING_CONTRACT,
        'address_to_domain',
        CallData.compile({ address, hint: [] })
      );
    });

    const result = await multicaller.execute();

    expect(
      starknetId.useDecoded(
        result.domains[domains['checkpoint.stark']].map(BigInt)
      )
    ).toBe('checkpoint.stark');
    expect(
      starknetId.useDecoded(
        result.domains[domains['fricoben.stark']].map(BigInt)
      )
    ).toBe('fricoben.stark');
    expect(
      starknetId.useDecoded(
        result.domains[domains['th0rgal.stark']].map(BigInt)
      )
    ).toBe('th0rgal.stark');
    expect(result.domains[addressWithoutDomain]).toEqual([]);
  }, 20000);

  it('should resolve a batch of domains to addresses', async () => {
    const multicaller = new Multicaller(network, provider, namingAbi, options);

    Object.keys(domains).forEach((domain) => {
      multicaller.call(
        ['addresses', domain],
        NAMING_CONTRACT,
        'domain_to_address',
        CallData.compile({
          domain: domain
            .replace('.stark', '')
            .split('.')
            .map((part) => starknetId.useEncoded(part).toString(10)),
          hint: []
        })
      );
    });

    const result = await multicaller.execute();

    Object.entries(domains).forEach(([domain, address]) => {
      expect(result.addresses[domain]).toBe(address);
    });
  }, 20000);
});
