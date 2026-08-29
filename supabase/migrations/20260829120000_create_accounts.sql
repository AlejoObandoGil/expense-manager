-- Create the accounts table with per-user Row Level Security, and seed a
-- default "Efectivo" cash account for every new user via a trigger on
-- auth.users (mirrors 20260823054741_create_categories.sql's
-- handle_new_user_categories()).
--
-- `initial_balance` is the only balance-related column: `currentBalance` is
-- never stored. It is derived on read by GetAccountsWithBalanceUseCase
-- (initial_balance + sum(income) - sum(expense) of the account's
-- transactions), matching how budgets.remaining/percentageUsed are derived
-- from amount/spent in ApiBudgetRepository rather than stored. This avoids
-- write-time balance-mutation logic and any risk of stored-balance drift.
--
-- `is_active` implements soft delete: an account with associated
-- transactions is deactivated (is_active = false) rather than deleted, so
-- ON DELETE RESTRICT on transactions.account_id (added in the next
-- migration) is a defensive backstop that real usage never triggers.
--
-- Same auth.uid() idiom as every other table: `default auth.uid()` on the
-- column (a subquery is not allowed in a DEFAULT expression), and the
-- `(select auth.uid())` subselect only inside policies.

begin;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('credit_card', 'checking', 'savings', 'cash', 'investment')),
  initial_balance numeric not null default 0,
  currency text not null default 'PEN',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts using btree (user_id);

alter table public.accounts enable row level security;

create policy "accounts_select_own"
  on public.accounts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "accounts_insert_own"
  on public.accounts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "accounts_update_own"
  on public.accounts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "accounts_delete_own"
  on public.accounts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create function public.handle_new_user_accounts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.accounts (user_id, name, type, initial_balance, currency)
  values (new.id, 'Efectivo', 'cash', 0, 'PEN');
  return new;
end;
$$;

create trigger on_auth_user_created_seed_accounts
  after insert on auth.users
  for each row execute function public.handle_new_user_accounts();

revoke execute on function public.handle_new_user_accounts() from public;
revoke execute on function public.handle_new_user_accounts() from anon, authenticated;

-- Backfill: the trigger above only fires for signups *after* this migration.
-- Existing users need their default "Efectivo" account created directly
-- here, once — both so they aren't left with zero accounts, and so the next
-- migration (…_add_transactions_accounts_fk.sql) has a real account per
-- user to repoint legacy account_id values at.
insert into public.accounts (user_id, name, type, initial_balance, currency)
select id, 'Efectivo', 'cash', 0, 'PEN' from auth.users;

commit;
