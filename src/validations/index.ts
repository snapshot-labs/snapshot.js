import basic from './basic';
import aaveSpaceValidation from './aave';
import nounsSpaceValidation from './nouns';
import shareOfTotalSupply from './share';

export default {
  basic,
  aave: aaveSpaceValidation,
  nouns: nounsSpaceValidation,
  share: shareOfTotalSupply
};
