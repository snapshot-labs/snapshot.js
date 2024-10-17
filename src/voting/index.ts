import singleChoice from './singleChoice';
import approval from './approval';
import quadratic from './quadratic';
import rankedChoice from './rankedChoice';
import copeland from './copeland';
import weighted from './weighted';

export default {
  'single-choice': singleChoice,
  approval,
  quadratic,
  'ranked-choice': rankedChoice,
  copeland,
  weighted,
  basic: singleChoice
};
