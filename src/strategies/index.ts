import { strategy as balancer } from './balancer';
import { strategy as contractCall } from './contract-call';
import { strategy as ensDomainsOwned } from './ens-domains-owned';
import { strategy as erc20BalanceOf } from './erc20-balance-of';
import { strategy as erc20BalanceOfCoeff } from './erc20-balance-of-coeff';
import { strategy as erc20BalanceOfFixedTotal } from './erc20-balance-of-fixed-total';
import { strategy as erc20BalanceOfCv } from './erc20-balance-of-cv';
import { strategy as erc20WithBalance } from './erc20-with-balance';
import { strategy as erc20BalanceOfDelegation } from './erc20-balance-of-delegation';
import { strategy as balancerDelegation } from './balancer-delegation';
import { strategy as ethBalance } from './eth-balance';
import { strategy as ethWalletAge } from './eth-wallet-age';
import { strategy as makerDsChief } from './maker-ds-chief';
import { strategy as uni } from './uni';
import { strategy as yearnVault } from './yearn-vault';
import { strategy as moloch } from './moloch';
import { strategy as uniswap } from './uniswap';
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
import { strategy as xDaiStake } from './xdai-stake';
import { strategy as defidollar } from './defidollar';
import { strategy as aavegotchi } from './aavegotchi';
import { strategy as mithcash } from './mithcash';
import { strategy as dittomoney } from './dittomoney';
import { strategy as balancerUnipool } from './balancer-unipool';
import { strategy as stablexswap } from './stablexswap';
import { strategy as stakedKeep } from './staked-keep';
import { strategy as typhoon } from './typhoon';

export default {
  balancer,
  'erc20-received': erc20Received,
  'contract-call': contractCall,
  'eth-received': ethReceived,
  'eth-philanthropy': ethPhilanthropy,
  'ens-domains-owned': ensDomainsOwned,
  'erc20-balance-of': erc20BalanceOf,
  'erc20-balance-of-fixed-total': erc20BalanceOfFixedTotal,
  'erc20-balance-of-cv': erc20BalanceOfCv,
  'erc20-balance-of-coeff': erc20BalanceOfCoeff,
  'erc20-with-balance': erc20WithBalance,
  'erc20-balance-of-delegation': erc20BalanceOfDelegation,
  'balancer-delegation': balancerDelegation,
  'eth-balance': ethBalance,
  'eth-wallet-age': ethWalletAge,
  'maker-ds-chief': makerDsChief,
  uni,
  'yearn-vault': yearnVault,
  moloch,
  uniswap,
  pancake,
  synthetix,
  ctoken,
  cream,
  'staked-uniswap': stakedUniswap,
  esd,
  'esd-delegation': esdDelegation,
  piedao,
  'xdai-stake': xDaiStake,
  defidollar,
  aavegotchi,
  mithcash,
  stablexswap,
  dittomoney,
  'staked-keep': stakedKeep,
  'balancer-unipool': balancerUnipool,
  typhoon
};
