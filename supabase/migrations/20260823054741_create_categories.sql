-- Create the categories table with per-user Row Level Security, and seed
-- the 18 default categories for every new user via a trigger on
-- auth.users.
--
-- Same pattern as transactions (see
-- 20260822060757_create_transactions.sql): `default auth.uid()` (not
-- `default (select auth.uid())`) on the column DEFAULT, because Postgres
-- rejects a subquery there ("cannot use subquery in DEFAULT expression").
-- The subselect wrapping is a policy-only idiom.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  emoji text not null,
  color text not null,
  type text not null check (type in ('income', 'expense', 'both'))
);

create index categories_user_id_idx on public.categories using btree (user_id);

alter table public.categories enable row level security;

-- One policy per operation, TO authenticated, scoped to the owning user via
-- auth.uid(). Wrapped in a subselect ((select auth.uid())) so Postgres
-- evaluates it once per statement instead of once per row.

create policy "categories_select_own"
  on public.categories
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "categories_insert_own"
  on public.categories
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "categories_update_own"
  on public.categories
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "categories_delete_own"
  on public.categories
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Seed the 18 default categories (src/infrastructure/data/categories.ts) for
-- every new user. `security definer` is required because this runs as part
-- of the `auth.users` insert (not as the authenticated user), so without it
-- the insert into public.categories would be blocked by RLS above. `user_id`
-- is set explicitly to `new.id` here — the column DEFAULT of `auth.uid()`
-- does not resolve to anything useful in this security context.
--
-- This trigger runs in the same transaction as the `auth.users` insert
-- (native Postgres behavior): if it fails, the whole signup fails. No
-- special error handling is added.

create function public.handle_new_user_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, emoji, color, type)
  values
    (new.id, 'Vivienda', '🏠', '#3b82f6', 'expense'),
    (new.id, 'Alimentación', '🍕', '#f97316', 'expense'),
    (new.id, 'Transporte', '🚗', '#8b5cf6', 'expense'),
    (new.id, 'Salud', '⚕️', '#ef4444', 'expense'),
    (new.id, 'Entretenimiento', '🎬', '#ec4899', 'expense'),
    (new.id, 'Compras', '🛍️', '#f59e0b', 'expense'),
    (new.id, 'Educación', '📚', '#6366f1', 'expense'),
    (new.id, 'Mascotas', '🐕', '#84cc16', 'expense'),
    (new.id, 'Viajes', '✈️', '#06b6d4', 'expense'),
    (new.id, 'Suscripciones', '📱', '#64748b', 'expense'),
    (new.id, 'Regalos', '🎁', '#e11d48', 'expense'),
    (new.id, 'Ahorros', '🏦', '#10b981', 'expense'),
    (new.id, 'Salario', '💼', '#10b981', 'income'),
    (new.id, 'Freelance', '💻', '#3b82f6', 'income'),
    (new.id, 'Inversiones', '📈', '#8b5cf6', 'income'),
    (new.id, 'Regalos Recibidos', '🎉', '#f97316', 'income'),
    (new.id, 'Otros Ingresos', '💰', '#22c55e', 'income'),
    (new.id, 'Transferencia', '🔄', '#64748b', 'both');
  return new;
end;
$$;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.handle_new_user_categories();
