-- Create the budgets table with per-user Row Level Security.
--
-- Same pattern as transactions/categories (see 20260822060757_create_transactions.sql
-- and 20260823054741_create_categories.sql): `default auth.uid()` (not
-- `default (select auth.uid())`) on the column DEFAULT, because Postgres
-- rejects a subquery there ("cannot use subquery in DEFAULT expression").
-- The subselect wrapping is a policy-only idiom.
--
-- Unlike transactions.category_id (still `text`, out of scope to change),
-- budgets.category_id is a real `uuid` FK to categories.id: budgets is a new
-- table with no legacy mock-data format to mirror. Note that a Postgres FK
-- constraint does not respect RLS, so this does not by itself validate that
-- the referenced category belongs to the same user — RLS on `budgets` still
-- ensures no other user can see or edit the row. See Design Notes in
-- spec-4-4-persist-budgets-via-supabase-with-rls.md for the accepted
-- limitation.
--
-- `remaining` and `percentageUsed` are intentionally not columns here — they
-- are derived from `amount`/`spent` and computed in `ApiBudgetRepository`
-- after insert/update, matching `MockBudgetRepository` today.

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  category_id uuid not null references public.categories(id),
  amount numeric not null check (amount > 0),
  spent numeric not null default 0 check (spent >= 0),
  month int not null check (month between 1 and 12),
  year int not null,
  unique (user_id, category_id, month, year)
);

create index budgets_user_id_idx on public.budgets using btree (user_id);

alter table public.budgets enable row level security;

-- One policy per operation, TO authenticated, scoped to the owning user via
-- auth.uid(). Wrapped in a subselect ((select auth.uid())) so Postgres
-- evaluates it once per statement instead of once per row.

create policy "budgets_select_own"
  on public.budgets
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "budgets_insert_own"
  on public.budgets
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "budgets_update_own"
  on public.budgets
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "budgets_delete_own"
  on public.budgets
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
