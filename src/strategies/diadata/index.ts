import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'diadata';
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
    }
  ];
  
  export async function strategy(
    network,
    provider,
    addresses,
    options,
    snapshot
  ) {
    const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
    const response = await multicall(
      network,
      provider,
      abi,
      addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
      { blockTag }
    );

        
    
    const final = response.map((value, i) => {
        let currAddr = addresses[i];
        let currBalance = parseFloat(formatUnits(value.toString(), options.decimals));
        let currVote;

        currBalance >=options.minTokenBalance ? currVote = 1 : currVote = 0;

        return [currAddr, currVote];
    })
    
    return final;
  }