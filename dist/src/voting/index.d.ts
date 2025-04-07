import singleChoice from './singleChoice';
import approval from './approval';
import quadratic from './quadratic';
import rankedChoice from './rankedChoice';
import copeland from './copeland';
import weighted from './weighted';
declare const _default: {
    'single-choice': typeof singleChoice;
    approval: typeof approval;
    quadratic: typeof quadratic;
    'ranked-choice': typeof rankedChoice;
    copeland: typeof copeland;
    weighted: typeof weighted;
    basic: typeof singleChoice;
};
export default _default;
