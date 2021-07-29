import * as balancer from './balancer';
import * as balancerSmartPool from './balancer-smart-pool';
import * as contractCall from './contract-call';
import * as ensDomainsOwned from './ens-domains-owned';
import * as ensReverseRecord from './ens-reverse-record';
import * as erc20BalanceOf from './erc20-balance-of';
import * as erc20BalanceOfCoeff from './erc20-balance-of-coeff';
import * as erc20BalanceOfFixedTotal from './erc20-balance-of-fixed-total';
import * as erc20BalanceOfCv from './erc20-balance-of-cv';
import * as erc20WithBalance from './erc20-with-balance';
import * as erc20BalanceOfDelegation from './erc20-balance-of-delegation';
import * as erc20BalanceOfQuadraticDelegation from './erc20-balance-of-quadratic-delegation';
import * as erc20Price from './erc20-price';
import * as balanceOfWithMin from './balance-of-with-min';
import * as balanceOfWithThresholds from './balance-of-with-thresholds';
import * as ethBalance from './eth-balance';
import * as ethWithBalance from './eth-with-balance';
import * as ethWalletAge from './eth-wallet-age';
import * as multichain from './multichain';
import * as makerDsChief from './maker-ds-chief';
import * as uni from './uni';
import * as yearnVault from './yearn-vault';
import * as fraxFinance from './frax-finance';
import * as moloch from './moloch';
import * as uniswap from './uniswap';
import * as flashstake from './flashstake';
import * as pancake from './pancake';
import * as synthetix from './synthetix';
import * as ctoken from './ctoken';
import * as cream from './cream';
import * as esd from './esd';
import * as esdDelegation from './esd-delegation';
import * as stakedUniswap from './staked-uniswap';
import * as piedao from './piedao';
import * as ethReceived from './eth-received';
import * as erc20Received from './erc20-received';
import * as ethPhilanthropy from './eth-philanthropy';
import * as xDaiEasyStaking from './xdai-easy-staking';
import * as xDaiPOSDAOStaking from './xdai-posdao-staking';
import * as xDaiStakeHolders from './xdai-stake-holders';
import * as xDaiStakeDelegation from './xdai-stake-delegation';
import * as defidollar from './defidollar';
import * as aavegotchi from './aavegotchi';
import * as aavegotchiAgip from './aavegotchi-agip';
import * as mithcash from './mithcash';
import * as dittomoney from './dittomoney';
import * as balancerUnipool from './balancer-unipool';
import * as sushiswap from './sushiswap';
import * as masterchef from './masterchef';
import * as stablexswap from './stablexswap';
import * as stakedKeep from './staked-keep';
import * as typhoon from './typhoon';
import * as delegation from './delegation';
import * as ticket from './ticket';
import * as work from './work';
import * as ticketValidity from './ticket-validity';
import * as opium from './opium';
import * as ocean from './ocean-marketplace';
import * as theGraphBalance from './the-graph-balance';
import * as theGraphDelegation from './the-graph-delegation';
import * as theGraphIndexing from './the-graph-indexing';
import * as whitelist from './whitelist';
import * as tokenlon from './tokenlon';
import * as rebased from './rebased';
import * as pobHash from './pob-hash';
import * as totalAxionShares from './total-axion-shares';
import * as erc1155BalanceOf from './erc1155-balance-of';
import * as erc1155BalanceOfCv from './erc1155-balance-of-cv';
import * as compLikeVotes from './comp-like-votes';
import * as governorAlpha from './governor-alpha';
import * as pagination from './pagination';
import * as rulerStakedToken from './ruler-staked-token';
import * as rulerStakedLP from './ruler-staked-lp';
import * as xcover from './xcover';
import * as niuStaked from './niu-staked';
import * as mushrooms from './mushrooms';
import * as curioCardsErc20Weighted from './curio-cards-erc20-weighted';
import * as saffronFinance from './saffron-finance';
import * as renNodes from './ren-nodes';
import * as multisigOwners from './multisig-owners';
import * as trancheStaking from './tranche-staking';
import * as pepemon from './pepemon';
import * as erc1155AllBalancesOf from './erc1155-all-balances-of';
import * as trancheStakingLP from './tranche-staking-lp';
import * as masterchefPoolBalance from './masterchef-pool-balance';
import * as masterchefPoolBalancePrice from './masterchef-pool-balance-price';
import * as avnBalanceOfStaked from './avn-balance-of-staked';
import * as badgeth from './badgeth';
import * as api from './api';
import * as xseen from './xseen';
import * as molochAll from './moloch-all';
import * as molochLoot from './moloch-loot';
import * as erc721Enumerable from './erc721-enumerable';
import * as erc721WithMultiplier from './erc721-with-multiplier';
import * as erc721WithTokenId from './erc721-with-tokenid';
import * as hoprUniLpFarm from './hopr-uni-lp-farm';
import * as erc721 from './erc721';
import * as apescape from './apescape';
import * as liftkitchen from './liftkitchen';
import * as decentralandEstateSize from './decentraland-estate-size';
import * as iotexBalance from './iotex-balance';
import * as iotexStakedBalance from './iotex-staked-balance';
import * as xrc20BalanceOf from './xrc20-balance-of';
import * as brightid from './brightid';
import * as inverseXINV from './inverse-xinv';
import * as modefi from './modefi';
import * as modefiStaking from './modefi-staking';
import * as spookyswap from './spookyswap';
import * as rnbwBalance from './rnbw-balance';
import * as celerSgnDelegation from './celer-sgn-delegation';
import * as balancerDelegation from './balancer-delegation';
import * as infinityProtocolPools from './infinityprotocol-liquidity-pools';
import * as aaveGovernancePower from './aave-governance-power';
import * as cake from './cake';
import * as planetFinance from './planet-finance';
import * as impossibleFinance from './impossible-finance';
import * as ogn from './ogn';
import * as zrxVotingPower from './zrx-voting-power';
import * as tombFinance from './tomb-finance';
import * as trancheStakingSLICE from './tranche-staking-slice';
import * as unipoolSameToken from './unipool-same-token';
import * as unipoolUniv2Lp from './unipool-univ2-lp';

export default {
  balancer,
  'balancer-smart-pool': balancerSmartPool,
  'erc20-received': erc20Received,
  'contract-call': contractCall,
  'eth-received': ethReceived,
  'eth-philanthropy': ethPhilanthropy,
  'ens-domains-owned': ensDomainsOwned,
  'ens-reverse-record': ensReverseRecord,
  'erc20-balance-of': erc20BalanceOf,
  'erc20-balance-of-fixed-total': erc20BalanceOfFixedTotal,
  'erc20-balance-of-cv': erc20BalanceOfCv,
  'erc20-balance-of-coeff': erc20BalanceOfCoeff,
  'erc20-with-balance': erc20WithBalance,
  'erc20-balance-of-delegation': erc20BalanceOfDelegation,
  'erc20-balance-of-quadratic-delegation': erc20BalanceOfQuadraticDelegation,
  'erc20-price': erc20Price,
  'balance-of-with-min': balanceOfWithMin,
  'balance-of-with-thresholds': balanceOfWithThresholds,
  'eth-balance': ethBalance,
  'eth-with-balance': ethWithBalance,
  'eth-wallet-age': ethWalletAge,
  'maker-ds-chief': makerDsChief,
  erc721,
  'erc721-enumerable': erc721Enumerable,
  'erc721-with-multiplier': erc721WithMultiplier,
  'erc721-with-tokenid': erc721WithTokenId,
  'erc1155-balance-of': erc1155BalanceOf,
  'erc1155-balance-of-cv': erc1155BalanceOfCv,
  multichain,
  uni,
  'frax-finance': fraxFinance,
  'yearn-vault': yearnVault,
  moloch,
  masterchef,
  sushiswap,
  uniswap,
  flashstake,
  pancake,
  synthetix,
  ctoken,
  cream,
  'staked-uniswap': stakedUniswap,
  esd,
  'esd-delegation': esdDelegation,
  piedao,
  'xdai-easy-staking': xDaiEasyStaking,
  'xdai-posdao-staking': xDaiPOSDAOStaking,
  'xdai-stake-holders': xDaiStakeHolders,
  'xdai-stake-delegation': xDaiStakeDelegation,
  defidollar,
  aavegotchi,
  'aavegotchi-agip': aavegotchiAgip,
  mithcash,
  stablexswap,
  dittomoney,
  'staked-keep': stakedKeep,
  'balancer-unipool': balancerUnipool,
  typhoon,
  delegation,
  ticket,
  work,
  'ticket-validity': ticketValidity,
  opium,
  'ocean-marketplace': ocean,
  'the-graph-balance': theGraphBalance,
  'the-graph-delegation': theGraphDelegation,
  'the-graph-indexing': theGraphIndexing,
  whitelist,
  tokenlon,
  rebased,
  'pob-hash': pobHash,
  'total-axion-shares': totalAxionShares,
  'comp-like-votes': compLikeVotes,
  'governor-alpha': governorAlpha,
  pagination,
  'ruler-staked-token': rulerStakedToken,
  'ruler-staked-lp': rulerStakedLP,
  xcover,
  'niu-staked': niuStaked,
  mushrooms: mushrooms,
  'curio-cards-erc20-weighted': curioCardsErc20Weighted,
  'ren-nodes': renNodes,
  'multisig-owners': multisigOwners,
  'tranche-staking': trancheStaking,
  pepemon,
  'erc1155-all-balances-of': erc1155AllBalancesOf,
  'saffron-finance': saffronFinance,
  'tranche-staking-lp': trancheStakingLP,
  'masterchef-pool-balance': masterchefPoolBalance,
  'masterchef-pool-balance-price': masterchefPoolBalancePrice,
  'avn-balance-of-staked': avnBalanceOfStaked,
  api,
  xseen,
  'moloch-all': molochAll,
  'moloch-loot': molochLoot,
  'hopr-uni-lp-farm': hoprUniLpFarm,
  apescape,
  liftkitchen,
  'decentraland-estate-size': decentralandEstateSize,
  brightid,
  'inverse-xinv': inverseXINV,
  modefi,
  'modefi-staking': modefiStaking,
  'iotex-balance': iotexBalance,
  'iotex-staked-balance': iotexStakedBalance,
  'xrc20-balance-of': xrc20BalanceOf,
  spookyswap,
  'rnbw-balance': rnbwBalance,
  'celer-sgn-delegation': celerSgnDelegation,
  'balancer-delegation': balancerDelegation,
  'infinityprotocol-liquidity-pools': infinityProtocolPools,
  'aave-governance-power': aaveGovernancePower,
  cake,
  'planet-finance': planetFinance,
  ogn,
  'impossible-finance': impossibleFinance,
  badgeth,
  'zrx-voting-power': zrxVotingPower,
  'tomb-finance': tombFinance,
  'tranche-staking-slice': trancheStakingSLICE,
  'unipool-same-token': unipoolSameToken,
  'unipool-univ2-lp': unipoolUniv2Lp
};
