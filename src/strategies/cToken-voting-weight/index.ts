import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.0';

const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
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
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'borrowBalanceStored',
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

export async function strategy(network, provider, addresses, options, snapshot) {
  //const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  let blockTag = typeof snapshot === 'number' ? (snapshot) : 'latest';
 

  const [balanceNowResponse, borrowResponse]  = await Promise.all([
    multicall(
      network,
      provider,
      abi,
      addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
      { blockTag }
    ),
    multicall(
      network,
      provider,
      abi,
      addresses.map((address: any) => [options.address, 'borrowBalanceStored', [address]]),
      { blockTag }
    )
  ]); 

  blockTag = typeof snapshot === 'number' ? (snapshot-options.offsetCheck) : 'latest';

  const balanceOldResponse = await multicall(
      network,
      provider,
      abi,
      addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
      { blockTag }
    );

  let resultData = {};
  for(let i = 0; i < balanceNowResponse.length; i++) {
    let noBorrow = 1;
    if(options.borrowingRestricted) {
      noBorrow = borrowResponse[i].toString().localeCompare('0') == 0 ? 1:0;
    }
    resultData[addresses[i]] = Math.min(parseFloat(formatUnits(balanceNowResponse[i].toString(), options.decimals)), parseFloat(formatUnits(balanceOldResponse[i].toString(), options.decimals))) * noBorrow;
  }

  return resultData;
}
