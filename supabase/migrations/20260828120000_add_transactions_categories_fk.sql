-- Add FK constraint transactions → categories with ON DELETE RESTRICT
--
-- This migration converts transactions.category_id from text to uuid and adds
-- a foreign key constraint to categories(id) with ON DELETE RESTRICT.
--
-- Atomicity & Safety:
-- - Entire migration runs in single transaction (BEGIN/COMMIT/ROLLBACK)
-- - Pre-migration checks use SELECT FOR UPDATE locks to prevent race conditions
-- - Validates no NULLs, all valid UUIDs, and all referenced categories exist
-- - If any check fails, entire migration rolls back with clear error message

begin;

-- ============================================================================
-- PHASE 1: Pre-migration validation with row-level locks
-- ============================================================================

-- Lock transactions table to prevent concurrent writes during validation
select * from public.transactions for update;

-- Validate: no NULL category_id values
do $$
begin
  if exists(select 1 from public.transactions where category_id is null) then
    raise exception 'Migration failed: found NULL values in category_id. All transactions must have a valid category.';
  end if;
end $$;

-- Validate: all category_id values are valid UUIDs
do $$
begin
  if exists(
    select 1
    from public.transactions
    where not (category_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  ) then
    raise exception 'Migration failed: found invalid UUID values in category_id. All category IDs must be valid UUIDs.';
  end if;
end $$;

-- Validate: all category_id values reference existing categories
do $$
declare
  orphaned_count int;
begin
  select count(*)
  into orphaned_count
  from public.transactions t
  where not exists(
    select 1 from public.categories c where c.id::text = t.category_id
  );

  if orphaned_count > 0 then
    raise exception 'Migration failed: found % transactions with non-existent category references. Orphaned transactions cannot be migrated.', orphaned_count;
  end if;
end $$;

-- ============================================================================
-- PHASE 2: Alter table to add FK constraint
-- ============================================================================

-- Convert category_id from text to uuid using explicit cast
alter table public.transactions
  alter column category_id type uuid using category_id::uuid,
  add constraint transactions_category_id_fk
    foreign key (category_id) references public.categories(id)
    on delete restrict;

-- ============================================================================
-- PHASE 3: Create index on category_id for query performance
-- ============================================================================

create index transactions_category_id_idx on public.transactions using btree (category_id);

-- ============================================================================
-- End transaction
-- ============================================================================

commit;
