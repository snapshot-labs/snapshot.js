import { strategy as balancer } from './balancer';
import { strategy as erc20BalanceOf } from './erc20-balance-of';
import { strategy as erc20BalanceOfFixedTotal } from './erc20-balance-of-fixed-total';
import { strategy as erc20BalanceOfCv } from './erc20-balance-of-cv';
import { strategy as makerDsChief } from './maker-ds-chief';
import { strategy as uni } from './uni';
import { strategy as contractCall } from './contract-call';

export default {
  balancer,
  'erc20-balance-of': erc20BalanceOf,
  'erc20-balance-of-fixed-total': erc20BalanceOfFixedTotal,
  'erc20-balance-of-cv': erc20BalanceOfCv,
  'maker-ds-chief': makerDsChief,
  'uni': uni,
  'contract-call': contractCall
};
