import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = '@MushroomsFinan1';
export const version = '0.1.0';

const erc20Abi = [
  {
	"inputs": [],
	"name": "totalSupply",
	"outputs": [{
		"internalType": "uint256",
		"name": "",
		"type": "uint256"
	}],
	"stateMutability": "view",
	"type": "function"
  },
  {
	"inputs": [{
		"internalType": "address",
		"name": "account",
		"type": "address"
	}],
	"name": "balanceOf",
	"outputs": [{
		"internalType": "uint256",
		"name": "",
		"type": "uint256"
	}],
	"stateMutability": "view",
	"type": "function"
  }
];

const masterChefAbi = [
  {
	"inputs": [{
		"internalType": "uint256",
		"name": "",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "",
		"type": "address"
	}],
	"name": "userInfo",
	"outputs": [{
		"internalType": "uint256",
		"name": "amount",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "rewardDebt",
		"type": "uint256"
	}],
	"stateMutability": "view",
	"type": "function"
  },
  {
	"inputs": [{
		"internalType": "uint256",
		"name": "",
		"type": "uint256"
	}],
	"name": "poolInfo",
	"outputs": [{
		"internalType": "contract IERC20",
		"name": "lpToken",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "allocPoint",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "lastRewardBlock",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "accMMPerShare",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amount",
		"type": "uint256"
	}],
	"stateMutability": "view",
	"type": "function"
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
  
  const response = await multicall(network, provider, masterChefAbi, addresses.map((address: any) => [options.masterchef, 'userInfo', [options.pool, address]]), {blockTag});
  const poolInfo = await multicall(network, provider, masterChefAbi, [[options.masterchef, 'poolInfo', [options.pool]]], {blockTag});

  let lpTotalSupply = 1;
  let poolMMBalance = 1;
  if (options.type === 'lp'){	   
      lpTotalSupply = await multicall(network, provider, erc20Abi, [[poolInfo.lpToken, 'totalSupply', []]], {blockTag});
      poolMMBalance = await multicall(network, provider, erc20Abi, [[options.govtoken, 'balanceOf', [poolInfo.lpToken]]], {blockTag});
  }
  
  return Object.fromEntries(
    Object.entries(response).map((value, index) => [
      addresses[index],
      parseFloat(formatUnits(((value.amount * poolMMBalance) / lpTotalSupply).toString(), 18))
    ])
  );
  
}
