import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { getScores, multicall } from '../../utils';

export const author = 'hoprnet';
export const version = '0.1.0';

const tokenAndPoolAbi = [
  {
    constant:true,
    inputs:[
       {
          internalType:"address",
          name:"",
          type:"address"
       }
    ],
    name:"balanceOf",
    outputs:[
       {
          internalType:"uint256",
          name:"",
          type:"uint256"
       }
    ],
    payable:false,
    stateMutability:"view",
    type:"function"
  },
  {
    constant:true,
    inputs:[

    ],
    name:"totalSupply",
    outputs:[
      {
          internalType:"uint256",
          name:"",
          type:"uint256"
      }
    ],
    payable:false,
    stateMutability:"view",
    type:"function"
  },
  {
    inputs:[
       {
          internalType:"address",
          name:"",
          type:"address"
       }
    ],
    name:"liquidityProviders",
    outputs:[
       {
          internalType:"uint256",
          name:"claimedUntil",
          type:"uint256"
       },
       {
          internalType:"uint256",
          name:"currentBalance",
          type:"uint256"
       }
    ],
    stateMutability:"view",
    type:"function"
 }
]

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const res = await multicall(
    network,
    provider,
    tokenAndPoolAbi,
    [
      [options.hoprAddress, 'balanceOf', [options.uniPoolAddress]],
      [options.uniPoolAddress, 'totalSupply', []],
    ].concat(
      addresses.map(
        (address: any) => [options.uniPoolAddress, 'balanceOf', [address]]
      )
    ).concat(
      blockTag >= options.farmDeployBlock || blockTag === 'latest' ? addresses.map(
        (address: any) => [options.farmAddress, 'liquidityProviders', [address]]
      ) : []
    ),
    { blockTag }
  );

  const hoprBalanceOfPool = res[0];
  const poolTotalSupply = res[1];
  const response: BigNumber[] = blockTag >= options.farmDeployBlock || blockTag === 'latest'
    ? res.slice(2, 2 + addresses.length).map((r, i) => (r[0] as BigNumber).add(res[2 + i + addresses.length][1] as BigNumber))
    : res.slice(2).map(r => r[0] as BigNumber);

  const hoprScore = await getScores(space, [{
      name: "erc20-balance-of",
      params: {
        address: options.hoprAddress,
        symbol: "HOPR",
        decimals: 18
      }
    }], "1", provider, addresses, snapshot);

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i], // LP token amount * pool's HOPR token balnce / total pool supply
      parseFloat(formatUnits(
        value.mul(hoprBalanceOfPool[0]).div(poolTotalSupply[0]
      ), 18))
      + hoprScore[0][addresses[i]] // HOPR token balance
    ])
  );
}
