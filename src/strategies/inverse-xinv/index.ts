import { formatUnits, parseUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';

export const author = '0xKiwi';
export const version = '0.1.0';

const xINV = '0x65b35d6Eb7006e0e607BC54EB2dFD459923476fE';
const ONE_E18 = parseUnits('1', 18);

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function exchangeRateStored() external view returns (uint256)'
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
  const exchangeRateResp = await multicall(
    network,
    provider,
    abi,
    [[xINV, 'exchangeRateStored', []]],
    { blockTag }
  );
  const exchangeRate = exchangeRateResp[0][0];

  const balanceResp = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [xINV, 'balanceOf', [address]]),
    { blockTag }
  );
  return Object.fromEntries(
    balanceResp.map((value, i) => [
      addresses[i],
      parseFloat(
        formatUnits(
          value[0].mul(exchangeRate).div(ONE_E18).toString(),
          options.decimals
        )
      )
    ])
  );
}
