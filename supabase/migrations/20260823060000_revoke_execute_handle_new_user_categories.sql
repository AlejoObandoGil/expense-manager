-- Security advisor (get_advisors, post-20260823054741_create_categories)
-- flagged handle_new_user_categories() as a `security definer` function
-- exposed via PostgREST RPC to `anon`/`authenticated` (default PUBLIC
-- EXECUTE grant on new functions). It's a `returns trigger` function, so
-- Postgres already refuses to invoke it outside a trigger context ("trigger
-- functions can only be called as triggers") — but revoking EXECUTE is the
-- standard remediation and removes the RPC surface entirely. This does not
-- affect the trigger itself, which invokes the function directly regardless
-- of EXECUTE grants.

revoke execute on function public.handle_new_user_categories() from public;
