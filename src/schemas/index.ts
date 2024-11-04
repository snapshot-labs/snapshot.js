import space from './space.json';
import proposal from './proposal.json';
import updateProposal from './update-proposal.json';
import vote from './vote.json';
import profile from './profile.json';
import subscription from './subscription.json';
import statement from './statement.json';
import zodiac from './zodiac.json';
import alias from './alias.json';

export default {
  space: space.definitions.Space,
  proposal: proposal.definitions.Proposal,
  updateProposal: updateProposal.definitions.UpdateProposal,
  vote: vote.definitions.Vote,
  profile: profile.definitions.Profile,
  subscription: subscription.definitions.Subscription,
  statement: statement.definitions.Statement,
  zodiac: zodiac.definitions.Zodiac,
  alias: alias.definitions.Alias
};
