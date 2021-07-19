import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import Multicaller from '../../utils/multicaller';

export const author = 'thecryptoundertaker';
export const version = '0.1.0';

const MASONRY_ADDRESS = '0x8764DE60236C5843D9faEB1B638fbCE962773B67';
const TSHARE_TOKEN_ADDRESS = '0x4cdF39285D7Ca8eB3f090fDA0C069ba5F4145B37';
const TSHARE_LP_TOKEN_ADDRESS = '0x4733bc45eF91cF7CcEcaeeDb794727075fB209F2';
const CEMETERY_ADDRESS = '0xcc0a87F7e7c693042a9Cc703661F5060c80ACb43';

const PRECISION = BigNumber.from(10).pow(18);

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
  },
  {
    constant: true,
    inputs: [],
    name: 'strategy',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
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

  let multi = new Multicaller(network, provider, abi, { blockTag });

  options.vaultTokens.forEach((token: any) => {
    multi.call(`vaultStrategies.${token.address}`, token.address, 'strategy');
  });

  const vaultStrategiesResult = await multi.execute();

  multi = new Multicaller(network, provider, abi, { blockTag });

  multi.call(`lp.tshareBalance`, TSHARE_TOKEN_ADDRESS, 'balanceOf', [
    TSHARE_LP_TOKEN_ADDRESS
  ]);
  multi.call(`lp.totalSupply`, TSHARE_LP_TOKEN_ADDRESS, 'totalSupply');
  options.vaultTokens.forEach((token: any) => {
    multi.call(
      `vaultTokens.totalSupply.${token.address}`,
      token.address,
      'totalSupply',
      []
    );
    multi.call(
      `vaultTokens.lpBalance.${token.address}`,
      CEMETERY_ADDRESS,
      'userInfo',
      ['1', vaultStrategiesResult.vaultStrategies[token.address]]
    );
  });

  addresses.forEach((address: any) => {
    multi.call(`tshare.${address}`, TSHARE_TOKEN_ADDRESS, 'balanceOf', [
      address
    ]);
    multi.call(`tshareInMasonry.${address}`, MASONRY_ADDRESS, 'balanceOf', [
      address
    ]);
    multi.call(`lpInCemetery.${address}`, CEMETERY_ADDRESS, 'userInfo', [
      '1',
      address
    ]);
    multi.call(`lp.${address}`, TSHARE_LP_TOKEN_ADDRESS, 'balanceOf', [
      address
    ]);
    options.vaultTokens.forEach((token: any) => {
      multi.call(
        `vaultTokens.${address}.${token.address}`,
        token.address,
        'balanceOf',
        [address]
      );
    });
  });

  const result = await multi.execute();

  return Object.fromEntries(
    addresses.map((address: any) => {
      const tshareInWallet = parseFloat(
        formatUnits(result.tshare[address], 18)
      );

      const tshareInLpInWallet = parseFloat(
        formatUnits(
          result.lp[address]
            .mul(PRECISION)
            .mul(result.lp.tshareBalance)
            .div(result.lp.totalSupply),
          18
        )
      );

      const tshareInMasonry = parseFloat(
        formatUnits(result.tshareInMasonry[address], 18)
      );

      const tshareInCemetery = parseFloat(
        formatUnits(
          result.lpInCemetery[address].amount
            .mul(PRECISION)
            .mul(result.lp.tshareBalance)
            .div(result.lp.totalSupply),
          18
        )
      );

      const tshareInVaults = options.vaultTokens.reduce(
        (previous: number, token: any) =>
          previous +
          parseFloat(
            formatUnits(
              result.vaultTokens[address][token.address]
                .mul(result.vaultTokens.lpBalance[token.address].amount)
                .div(result.vaultTokens.totalSupply[token.address])
                .mul(result.lp.tshareBalance)
                .div(result.lp.totalSupply),
              18
            )
          ),
        0
      );

      return [
        address,
        Math.sqrt(
          tshareInWallet +
            tshareInLpInWallet +
            tshareInMasonry +
            tshareInCemetery +
            tshareInVaults
        )
      ];
    })
  );
}
