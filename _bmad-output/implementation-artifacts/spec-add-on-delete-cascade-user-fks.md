---
title: 'Agregar ON DELETE CASCADE en FKs user_id (transactions, categories, budgets)'
type: 'feature'
created: '2026-08-28'
status: 'done'
review_loop_iteration: 0
baseline_commit: '63f2fe204908c2b9e5e3518e53c72de92d9f93b0'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problema:** `transactions.user_id`, `categories.user_id`, `budgets.user_id` no especifican `ON DELETE` — si se borra un usuario de `auth.users`, falla la FK con error crudo en lugar de limpiar sus datos.

**Enfoque:** Agregar `ON DELETE CASCADE` en las 3 tablas, permitiendo borrar usuario sin dejar data huérfana. Requerido para feature "delete account".

## Boundaries & Constraints

**Always:**
- `ON DELETE CASCADE` en `transactions.user_id`, `categories.user_id`, `budgets.user_id`
- Atomicity: todas las alteraciones en una sola transacción
- Preservar integridad: borrar usuario cascada-borra sus categorías/budgets/transactions

**Never:**
- `ON DELETE RESTRICT` — bloquearía delete account
- `ON DELETE SET NULL` — permitiría transacciones huérfanas

</frozen-after-approval>

## Code Map

- `supabase/migrations/20260822060757_create_transactions.sql:14` — `user_id` FK, sin `ON DELETE`
- `supabase/migrations/20260823054741_create_categories.sql:13` — `user_id` FK, sin `ON DELETE`
- `supabase/migrations/20260823070000_create_budgets.sql:26` — `user_id` FK, sin `ON DELETE`

## Tasks & Acceptance

**Execution:**
- [x] Nueva migración SQL: `20260828011507_add_on_delete_cascade_user_fks.sql` — `ALTER TABLE ... ADD CONSTRAINT ... ON DELETE CASCADE` para las 3 FKs
- [x] `npm run build` — Zero blast radius

**Acceptance Criteria:**
- Dado que borro un usuario de `auth.users`, cuando la cascada ejecuta, entonces sus transactions/categories/budgets se borran automáticamente sin FK violation
- Dado que una categoría tiene presupuestos, cuando borro el usuario propietario, entonces los presupuestos también se borran

## Verification

**Manual:**
- Crear usuario con categorías/transacciones/budgets
- Borrar usuario desde Supabase Auth
- Verificar en BD: categorías/transacciones/budgets del usuario desaparecen (cascada)
