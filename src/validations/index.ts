import basic from './basic';
import aaveSpaceValidation from './aave';
import nounsSpaceValidation from './nouns';
import timeperiodSpaceValidation from './timeperiod';

export default {
  basic,
  aave: aaveSpaceValidation,
  nouns: nounsSpaceValidation,
  timeperiod: timeperiodSpaceValidation
};
