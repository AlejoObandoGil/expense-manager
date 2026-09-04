-- Add FK constraint transactions → accounts with ON DELETE RESTRICT
--
-- This migration converts transactions.account_id from text to uuid and adds
-- a foreign key constraint to accounts(id) with ON DELETE RESTRICT.
--
-- Unlike the categories FK migration (20260828120000), account_id starts out
-- nullable and, for pre-existing rows, may hold the UI's old mock-data
-- placeholder ('acc-1') instead of a real UUID. Rows with a NULL or
-- non-UUID account_id are backfilled to the same user's "Efectivo"
-- (type = 'cash') account -- guaranteed to exist for every user by
-- 20260829120000_create_accounts.sql's seed trigger + one-time backfill --
-- before the column is made NOT NULL.
--
-- Atomicity & Safety:
-- - Entire migration runs in a single transaction (BEGIN/COMMIT/ROLLBACK)
-- - Pre-migration lock uses SELECT FOR UPDATE to prevent race conditions
-- - Backfills NULL/non-UUID account_id to the row's user's cash account
-- - Aborts if any user has no cash account to backfill to (should not
--   happen after 20260829120000) rather than fabricating one inline
-- - Validates no NULLs/invalid UUIDs/orphans remain, then converts the
--   column type, sets NOT NULL, adds the FK, and creates an index

begin;

-- ============================================================================
-- PHASE 1: Lock + backfill
-- ============================================================================

-- Lock transactions table to prevent concurrent writes during migration
select * from public.transactions for update;

-- Backfill: any row whose account_id is NULL or not a valid UUID (e.g. the
-- old mock-data placeholder 'acc-1') is repointed at the same user's cash
-- account.
update public.transactions t
set account_id = (
  select a.id::text
  from public.accounts a
  where a.user_id = t.user_id
    and a.type = 'cash'
  order by a.created_at asc
  limit 1
)
where t.account_id is null
   or not (t.account_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- ============================================================================
-- PHASE 2: Post-backfill validation
-- ============================================================================

-- Validate: no NULL account_id values remain. A NULL here means some
-- transaction's user_id has no 'cash' account for the backfill above to
-- find -- abort rather than fabricating one, since that should not happen
-- after 20260829120000's seed trigger + one-time backfill.
do $$
begin
  if exists(select 1 from public.transactions where account_id is null) then
    raise exception 'Migration failed: found transactions whose user has no cash account to backfill account_id to.';
  end if;
end $$;

-- Validate: all account_id values are now valid UUIDs (defensive; the
-- backfill above should guarantee this, but confirm before the type cast).
do $$
begin
  if exists(
    select 1
    from public.transactions
    where not (account_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  ) then
    raise exception 'Migration failed: found invalid UUID values in account_id after backfill.';
  end if;
end $$;

-- Validate: all account_id values reference existing accounts.
do $$
declare
  orphaned_count int;
begin
  select count(*)
  into orphaned_count
  from public.transactions t
  where not exists(
    select 1 from public.accounts a where a.id::text = t.account_id
  );

  if orphaned_count > 0 then
    raise exception 'Migration failed: found % transactions with non-existent account references. Orphaned transactions cannot be migrated.', orphaned_count;
  end if;
end $$;

-- ============================================================================
-- PHASE 3: Alter table -- type change, NOT NULL, FK constraint
-- ============================================================================

alter table public.transactions
  alter column account_id type uuid using account_id::uuid,
  alter column account_id set not null,
  add constraint transactions_account_id_fk
    foreign key (account_id) references public.accounts(id)
    on delete restrict;

-- ============================================================================
-- PHASE 4: Create index on account_id for query performance
-- ============================================================================

create index transactions_account_id_idx on public.transactions using btree (account_id);

-- ============================================================================
-- End transaction
-- ============================================================================

commit;
