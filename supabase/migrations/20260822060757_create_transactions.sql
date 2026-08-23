-- Create the transactions table with per-user Row Level Security.
--
-- category_id / account_id are plain text (not uuid / FK): they mirror the
-- current mock data format ("cat-1", "acc-1"). There is no categories or
-- accounts table yet (categories lands in Story 4.3), so no FK is possible.

-- Note: `default auth.uid()` (not `default (select auth.uid())`) — Postgres
-- rejects a subquery in a DEFAULT expression ("cannot use subquery in DEFAULT
-- expression"). The subselect wrapping is a policy-only idiom (see below),
-- not applicable to DEFAULT/plain function calls.

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  amount numeric not null,
  description text not null,
  category_id text not null,
  account_id text,
  date timestamptz not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_id_idx on public.transactions using btree (user_id);

alter table public.transactions enable row level security;

-- One policy per operation, TO authenticated, scoped to the owning user via
-- auth.uid(). Wrapped in a subselect ((select auth.uid())) so Postgres
-- evaluates it once per statement instead of once per row.

create policy "transactions_select_own"
  on public.transactions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "transactions_insert_own"
  on public.transactions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "transactions_update_own"
  on public.transactions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "transactions_delete_own"
  on public.transactions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
