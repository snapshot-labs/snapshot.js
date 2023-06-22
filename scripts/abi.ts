const { Interface, FormatTypes } = require('@ethersproject/abi');

const jsonAbi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

const abi = new Interface(JSON.stringify(jsonAbi));
console.log(abi.format(FormatTypes.full));
