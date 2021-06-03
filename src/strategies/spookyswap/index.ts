import { formatUnits } from '@ethersproject/units';
import Multicaller from '../../utils/multicaller';

export const author = 'ooGwei';
export const version = '0.1.0';

const FARM_ADDRESS = '0x2b2929E785374c651a81A63878Ab22742656DcDd';
const LP_TOKEN_ADDRESS = '0xEc7178F4C41f346b2721907F5cF7628E388A7a58';
const BOO_TOKEN_ADDRESS = '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'userInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'rewardDebt',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
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
  const multi = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((address: any) => {
    multi.call(`boo.${address}`, BOO_TOKEN_ADDRESS, 'balanceOf', [address]);
    multi.call(`lpInFarm.${address}`, FARM_ADDRESS, 'userInfo', ['0', address]);
    multi.call(`lp.${address}`, LP_TOKEN_ADDRESS, 'balanceOf', [address]);
    options.vaultTokens.forEach((token: any) => {
      multi.call(
        `vaultTokens.${address}.${token.address}`,
        token.address,
        'balanceOf',
        [address]
      );
    });
  });
  multi.call(`lp.totalSupply`, LP_TOKEN_ADDRESS, 'totalSupply', []);
  multi.call(`lp.boo`, BOO_TOKEN_ADDRESS, 'balanceOf', [LP_TOKEN_ADDRESS]);

  const result = await multi.execute();

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      parseFloat(
        formatUnits(
          result.boo[address]
            .mul(options.boo.numerator)
            .div(options.boo.denominator),
          18
        )
      ) +
        parseFloat(
          formatUnits(
            result.lpInFarm[address]
              .mul(result.lp.boo)
              .div(result.lp.totalSupply)
              .mul(options.lp.numerator)
              .div(options.lp.denominator),
            18
          )
        ) +
        parseFloat(
          formatUnits(
            result.lp[address]
              .mul(result.lp.boo)
              .div(result.lp.totalSupply)
              .mul(options.lp.numerator)
              .div(options.lp.denominator),
            18
          )
        ) +
        options.vaultTokens.reduce(
          (prev: number, token: any, idx: number) =>
            prev +
            parseFloat(
              formatUnits(
                result.vaultTokens[address][token.address]
                  .mul(options.vaultTokens[idx].numerator)
                  .div(options.vaultTokens[idx].denominator),
                options.vaultTokens[idx].decimal
              )
            ),
          0
        )
    ])
  );
}
