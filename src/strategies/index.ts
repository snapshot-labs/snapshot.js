import { strategy as balancer } from './balancer';
import { strategy as contractCall } from './contract-call';
import { strategy as ensDomainsOwned } from './ens-domains-owned';
import { strategy as ensReverseRecord } from './ens-reverse-record';
import { strategy as erc20BalanceOf } from './erc20-balance-of';
import { strategy as erc20BalanceOfCoeff } from './erc20-balance-of-coeff';
import { strategy as erc20BalanceOfFixedTotal } from './erc20-balance-of-fixed-total';
import { strategy as erc20BalanceOfCv } from './erc20-balance-of-cv';
import { strategy as erc20WithBalance } from './erc20-with-balance';
import { strategy as erc20BalanceOfDelegation } from './erc20-balance-of-delegation';
import { strategy as erc20Price } from './erc20-price';
import { strategy as balanceOfWithMin } from './balance-of-with-min';
import { strategy as ethBalance } from './eth-balance';
import { strategy as ethWalletAge } from './eth-wallet-age';
import { strategy as multichain } from './multichain';
import { strategy as makerDsChief } from './maker-ds-chief';
import { strategy as uni } from './uni';
import { strategy as yearnVault } from './yearn-vault';
import { strategy as fraxFinance } from './frax-finance';
import { strategy as moloch } from './moloch';
import { strategy as uniswap } from './uniswap';
import { strategy as flashstake } from './flashstake';
import { strategy as pancake } from './pancake';
import { strategy as synthetix } from './synthetix';
import { strategy as ctoken } from './ctoken';
import { strategy as cream } from './cream';
import { strategy as esd } from './esd';
import { strategy as esdDelegation } from './esd-delegation';
import { strategy as stakedUniswap } from './staked-uniswap';
import { strategy as piedao } from './piedao';
import { strategy as ethReceived } from './eth-received';
import { strategy as erc20Received } from './erc20-received';
import { strategy as ethPhilanthropy } from './eth-philanthropy';
import { strategy as xDaiEasyStaking } from './xdai-easy-staking';
import { strategy as xDaiPOSDAOStaking } from './xdai-posdao-staking';
import { strategy as xDaiStakeHolders } from './xdai-stake-holders';
import { strategy as xDaiStakeDelegation } from './xdai-stake-delegation';
import { strategy as defidollar } from './defidollar';
import { strategy as aavegotchi } from './aavegotchi';
import { strategy as mithcash } from './mithcash';
import { strategy as dittomoney } from './dittomoney';
import { strategy as balancerUnipool } from './balancer-unipool';
import { strategy as sushiswap } from './sushiswap';
import { strategy as masterchef } from './masterchef';
import { strategy as stablexswap } from './stablexswap';
import { strategy as stakedKeep } from './staked-keep';
import { strategy as typhoon } from './typhoon';
import { strategy as delegation } from './delegation';
import { strategy as ticket } from './ticket';
import { strategy as work } from './work';
import { strategy as ticketValidity } from './ticket-validity';
import { strategy as opium } from './opium';
import { strategy as ocean } from './ocean-marketplace';
import { strategy as theGraphBalance } from './the-graph-balance';
import { strategy as theGraphDelegation } from './the-graph-delegation';
import { strategy as theGraphIndexing } from './the-graph-indexing';
import { strategy as whitelist } from './whitelist';
import { strategy as tokenlon } from './tokenlon';
import { strategy as rebased } from './rebased';
import { strategy as pobHash } from './pob-hash';
import { strategy as totalAxionShares } from './total-axion-shares';
import { strategy as erc1155BalanceOf } from './erc1155-balance-of';
import { strategy as erc1155BalanceOfCv } from './erc1155-balance-of-cv';
import { strategy as compLikeVotes } from './comp-like-votes';
import { strategy as governorAlpha } from './governor-alpha';
import { strategy as pagination } from './pagination';
import { strategy as rulerStakedLP } from './ruler-staked-lp';
import { strategy as xcover } from './xcover';
import { strategy as niuStaked } from './niu-staked';
import { strategy as mushrooms } from './mushrooms';
import { strategy as curioCardsErc20Weighted } from './curio-cards-erc20-weighted';
import { strategy as saffronFinance } from './saffron-finance';
import { strategy as renNodes } from './ren-nodes';
import { strategy as multisigOwners } from './multisig-owners';
import { strategy as trancheStaking } from './tranche-staking';
import { strategy as pepemon } from './pepemon';
import { strategy as erc1155AllBalancesOf } from './erc1155-all-balances-of';
import { strategy as trancheStakingLP } from './tranche-staking-lp';
import { strategy as masterchefPoolBalance } from './masterchef-pool-balance';
import { strategy as avnBalanceOfStaked } from './avn-balance-of-staked';
import { strategy as api } from './api';
import { strategy as xseen } from './xseen';
import { strategy as molochAll } from './moloch-all';
import { strategy as molochLoot } from './moloch-loot';
import { strategy as erc721Enumerable } from './erc721-enumerable';
import { strategy as erc721WithMultiplier } from './erc721-with-multiplier';
import { strategy as hoprUniLpFarm } from './hopr-uni-lp-farm';
import { strategy as erc721 } from './erc721';
import { strategy as apescape } from './apescape';
import { strategy as liftkitchen } from './liftkitchen';
import { strategy as decentralandEstateSize } from './decentraland-estate-size';
import { strategy as iotexBalance } from './iotex-balance';
import { strategy as xrc20BalanceOf } from './xrc20-balance-of';
import { strategy as brightid } from './brightid';
import { strategy as inverseXINV } from './inverse-xinv';
import { strategy as modefi } from './modefi';
import { strategy as spookyswap } from './spookyswap';
import { strategy as rnbwBalance } from './rnbw-balance';
import { strategy as celerSgnDelegation } from './celer-sgn-delegation';
import { strategy as balancerDelegation } from './balancer-delegation';
import { strategy as aaveGovernancePower } from './aave-governance-power';

export default {
  balancer,
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
  'erc20-price': erc20Price,
  'balance-of-with-min': balanceOfWithMin,
  'eth-balance': ethBalance,
  'eth-wallet-age': ethWalletAge,
  'maker-ds-chief': makerDsChief,
  erc721,
  'erc721-enumerable': erc721Enumerable,
  'erc721-with-multiplier': erc721WithMultiplier,
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
  'iotex-balance': iotexBalance,
  'xrc20-balance-of': xrc20BalanceOf,
  spookyswap,
  'rnbw-balance': rnbwBalance,
  'celer-sgn-delegation': celerSgnDelegation,
  'balancer-delegation': balancerDelegation,
  'aave-governance-power': aaveGovernancePower
};
