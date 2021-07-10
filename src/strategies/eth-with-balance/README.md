# ETH minimum balance strategy

A strategy similar to `erc-20-with-balance`, but for the ETH balance.

Using a low minimum balance, this strategy can be used as a proxy for "active Ethereum address", based on the assumption that active addresses will always have some ETH on them to pay for fees.

# Parameters

`minBalance`: minimum ETH balance required to get voting power of 1.