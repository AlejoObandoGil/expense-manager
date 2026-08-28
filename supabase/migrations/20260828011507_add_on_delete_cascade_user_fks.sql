-- Add ON DELETE CASCADE to user_id foreign keys
--
-- Problem: transactions.user_id, categories.user_id, budgets.user_id do not
-- specify ON DELETE behavior. If a user is deleted from auth.users, the FK
-- constraint fails with a raw error instead of cleaning up their data.
--
-- Solution: Add ON DELETE CASCADE to all three user_id FKs. This allows
-- deleting a user and automatically cascades the deletion to all their
-- transactions, categories, and budgets (preventing orphaned data and
-- supporting the "delete account" feature).
--
-- Atomicity & Safety:
-- - Entire migration runs in a single transaction
-- - Alter each table to drop the old FK and add a new one with ON DELETE CASCADE
-- - No data loss: CASCADE only applies on user deletion, not during migration

begin;

-- ============================================================================
-- PHASE 1: Add ON DELETE CASCADE to transactions.user_id
-- ============================================================================

alter table public.transactions
  drop constraint transactions_user_id_fkey,
  add constraint transactions_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- ============================================================================
-- PHASE 2: Add ON DELETE CASCADE to categories.user_id
-- ============================================================================

alter table public.categories
  drop constraint categories_user_id_fkey,
  add constraint categories_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- ============================================================================
-- PHASE 3: Add ON DELETE CASCADE to budgets.user_id
-- ============================================================================

alter table public.budgets
  drop constraint budgets_user_id_fkey,
  add constraint budgets_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- ============================================================================
-- End transaction
-- ============================================================================

commit;
