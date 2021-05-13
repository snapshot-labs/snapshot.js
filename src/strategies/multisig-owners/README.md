# Multisig Strategy

To use this strategy, you would have a multisig contract which has a set of owners. Pass the
address of that multisig into the params for the strategy. Then, each owner of the multisig will
have one vote for the strategy. This is great when you have a council of multisig members, where
each members vote is worth one.