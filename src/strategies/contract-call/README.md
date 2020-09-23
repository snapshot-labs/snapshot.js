# Contract call strategy

Allows any contract method to be used to calculate voter scores.

## Examples

Can be used instead of the erc20-balance-of strategy, the space config will look like this:

```JSON
{
  "strategies": [
    ["contract-call", {
      // token address
      "address": "0x6887DF2f4296e8B772cb19479472A16E836dB9e0",
      // token decimals
      "decimals": 18,
      // token symbol
      "symbol": "DAI",
      // ABI for balanceOf method
      "methodABI": {
        "constant": true,
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
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    }],
  ]
}
```

You can call methods with multiple inputs in any contract:

```JSON
{
  "strategies": [
    ["contract-call", {
      // contract address
      "address": "0x6887DF2f4296e8B772cb19479472A16E836dB9e0",
      // output decimals
      "decimals": 18,
      // strategy symbol
      "symbol": "mySCORE",
      // arguments are passed to the method; "%{address}" is replaced with the voter's address; default value ["%{address}"]
      "args": ["0x6887DF2f4296e8B772cb19479472A16E836dB9e0", "%{address}"], 
      // method ABI, output type should be uint256
      "methodABI": {
        "constant": true,
        "inputs": [{
          "internalType": "address",
          "name": "_someAddress",
          "type": "address"
        }, {
          "internalType": "address",
          "name": "_voterAddress",
          "type": "address"
        }],
        "name": "totalScoresFor",
        "outputs": [{
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    }],
  ]
}
```
