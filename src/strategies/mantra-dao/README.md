MANTRA DAO strategy

The strategy combines balances of two different staking contracts and outputs a merged score.

The ANTRA DAO strategy gives the option for one of the staked balances scores to be scaled up or down in terms of vote weighting.
passing -> options.omUniScalingFactor

Our tokens are the OM erc20 and the UNI V2 OM synthetic token found at:
omStakingAddress and omUniStakingAddress

Example:

A address has a staked balance of 10 in contract-1 and a staked balance of 10 in contract-2.

with a scaling factor of 1.0 their output score will be 20 (10 + 10)
with a scaling factor of 2.0 their output score will be 30 (10 + 20)
and so on.


