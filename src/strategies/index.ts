import { strategy as balancer } from './balancer';
import { strategy as contractCall } from './contract-call';
import { strategy as creamSwap } from './cream-swap';
import { strategy as erc20BalanceOf } from './erc20-balance-of';
import { strategy as erc20BalanceOfCoeff } from './erc20-balance-of-coeff';
import { strategy as erc20BalanceOfFixedTotal } from './erc20-balance-of-fixed-total';
import { strategy as erc20BalanceOfCv } from './erc20-balance-of-cv';
import { strategy as ethBalance } from './eth-balance';
import { strategy as makerDsChief } from './maker-ds-chief';
import { strategy as uni } from './uni';
import { strategy as yearnVault } from './yearn-vault';
import { strategy as moloch } from './moloch';
import { strategy as pancake } from './pancake';
import { strategy as synthetix } from './synthetix';
import { strategy as erc20WithBalance } from './erc20-with-balance';

export default {
  balancer,
  'contract-call': contractCall,
  'cream-swap': creamSwap,
  'erc20-balance-of': erc20BalanceOf,
  'erc20-balance-of-fixed-total': erc20BalanceOfFixedTotal,
  'erc20-balance-of-cv': erc20BalanceOfCv,
  'erc20-balance-of-coeff': erc20BalanceOfCoeff,
  'erc20-with-balance': erc20WithBalance,
  'eth-balance': ethBalance,
  'maker-ds-chief': makerDsChief,
  uni,
  'yearn-vault': yearnVault,
  moloch,
  pancake,
  synthetix
};
