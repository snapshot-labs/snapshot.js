# DeFiat

Snapshot strategy to calculate total DFT exposure at a given block and grant equivalent voting power via Smart Contract call.

DeFiat_VotingPower Contract: https://etherscan.io/address/0x594aca0b33b041b8d66d482daccc7819fee45e0a#code

This contract grants voting power based on the following formula:  
`Voting_Power = Total_DFT_Balance + Total_DFT_Staked + Total_DFT_Rewards_Pending + (Total_DFT-UNI-V2_Staked * DFT_PER_UNI_V2)`  

Current whitelisted staking pools are the following:  
- DFT Dungeon: https://etherscan.io/address/0xB508Dd7EeD4517bc66462cd384c0849d99B160fc  
- Points Palace: https://etherscan.io/address/0x973a2B39F7D59C0E59097f26C0921b60597aFe57  
- Liquidity Lab: https://etherscan.io/address/0x7BACeF5001203724B1D8b5480dfb7238fcA1375c  