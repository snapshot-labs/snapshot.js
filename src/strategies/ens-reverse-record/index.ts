import { call } from '../../utils';
import namehash from 'eth-ens-namehash';

export const author = 'makoto';
export const version = '0.1.0';

const abi = [
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'addresses',
        type: 'address[]'
      }
    ],
    name: 'getNames',
    outputs: [
      {
        internalType: 'string[]',
        name: 'r',
        type: 'string[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const CONTRACTS = {
  '1': '0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C',
  '3': '0x5bBFe410e18DCcaebbf5fD7A00844d4255615258',
  '4': '0x196eC7109e127A353B709a20da25052617295F6f',
  '5': '0x333Fc8f550043f239a2CF79aEd5e9cF4A20Eb41e'
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const contractAdress = CONTRACTS[network];
  const response = await call(
    provider,
    abi,
    [contractAdress, 'getNames', [addresses]],
    { blockTag }
  );
  let r = Object.fromEntries(
    response.map((value, i) => {
      const isEligible =
        value !== '' &&
        namehash.normalize(value) === value &&
        value.split('.').length === 2; // no subdomain

      const number = isEligible ? 1 : 0;
      return [addresses[i], number];
    })
  );
  return r;
}
