This is a variant of erc20-balance-of-delegation strategy that preserves voting power in case of quadratic voting.

Problem with erc20-balance-of-delegation is that if used with quadratic voting, total voting power that delegate has is less than expected.
In other words, delegation causes voting power loss. To fix this, we created this strategy.

Say there are two persons, with 100 vote credits each, in a quadratic voting setting. Person A delegates to person B.

Using erc-20-balance-of-delegation:

Voting Credits of Person B = Voting Credits of Person A + Voting Credits of Person B = 200

Person A could cast 10 (10^2=100) votes individually, similarly Person B could cast 10 (10^2=100) votes individually, so in total they could cast 20 votes.
But now, delegate can't cast 20 votes (20^2=400) because it needs 400 credits.

Solution:

Voting Credits of Person B = (Sqrt(Voting Credits of Person A) + Sqrt(Voting Credits of Person B))^2 = 400

Now the delegate can represent the sum of individual voting powers.
