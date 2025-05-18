2. git repo url should be of the correct format and should include a branch name
   in the path

3. git repo key should be checked to see if it is a valid key, by probing the
   server

4. How would deletions be handled ? When the xml record is removed, what happens
   ?

5. need to warn users when moneyworks fails because the record is locked by
   another user

6. need a way to show users what changed, so the commit browsing, so we know
   what we changed, and which user changed it

No retry logic when there are errors. Some errors are retryable, and we should
be able to handle those. Also so long as we crash nicely, the pm2 manager should
restart - so we must have good logging output from pm2.

We could avoid the time travel problem such that if time travel is detected, we
just don't update the last modified time, until everything is in the past.

must only update the config once we have completed the pull, since a crash part
way thru causes re-pull to be skipped
