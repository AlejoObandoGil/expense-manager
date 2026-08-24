-- Follow-up to 20260823060000_revoke_execute_handle_new_user_categories.sql:
-- revoking EXECUTE from PUBLIC alone did not clear the security advisor
-- warning — `has_function_privilege('anon', ..., 'EXECUTE')` still returned
-- true, because Supabase grants EXECUTE on public-schema functions directly
-- to `anon`/`authenticated` via ALTER DEFAULT PRIVILEGES, not only through
-- PUBLIC. Revoking from those roles explicitly is what actually removes the
-- PostgREST RPC surface; confirmed via get_advisors returning zero findings
-- after this statement.

revoke execute on function public.handle_new_user_categories() from anon, authenticated;
