const snapshot = require('../');
const space = require('./examples/space.json');
const proposal = require('./examples/proposal.json');
const vote = require('./examples/vote.json');
const profile = require('./examples/profile.json');

const isValidSpace = snapshot.utils.validateSchema(
  snapshot.schemas.space,
  space
);
console.log('Space', isValidSpace);

const isValidProposal = snapshot.utils.validateSchema(
  snapshot.schemas.proposal,
  proposal
);
console.log('Proposal', isValidProposal);

const isValidVote = snapshot.utils.validateSchema(snapshot.schemas.vote, vote);
console.log('Vote', isValidVote);

const isValidProfile = snapshot.utils.validateSchema(
  snapshot.schemas.profile,
  profile
);
console.log('Profile', isValidProfile);
