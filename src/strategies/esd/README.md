# ESD Call Strategy

Allows bonded ESD to be counted towards a valid score.

## Params

- `dao` - Address of the DAO proxy address
- `token` - Address of the ESD token
- `Rewards` - Address of the current LP rewards contract 
- `uniswap` - Address of the Uniswap pool
- `decimals` - Decimals used by the ESD token

### Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
"strategies": [
	{
		"name": "esd",
		"params": {
				"uniswap": "0x88ff79eB2Bc5850F27315415da8685282C7610F9",
				"rewards": "0x4082D11E506e3250009A991061ACd2176077C88f",
				"dao": "0x443d2f2755db5942601fa062cc248aaa153313d3",
				"token": "0x36F3FD68E7325a35EB768F1AedaAe9EA0689d723",
				"decimals": 18
		}
	}
]