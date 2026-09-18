---
title: 'Add account_id to Transactions'
type: 'feature'
created: '2026-09-03'
status: 'in-progress'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md']
baseline_commit: 'a1675dd80d607617e46ccbb73d56ee4042c5a7b1'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `transactions.account_id` es `text` nullable sin FK y `Transaction.accountId` es opcional en el dominio — ninguna transacción está realmente vinculada a una cuenta, y la UI manda un hardcode (`'acc-1'`) que no es un UUID real en Supabase.

**Approach:** Migrar `account_id` a `uuid` con FK (`ON DELETE RESTRICT`) e índice, con backfill hacia la cuenta "Efectivo" del mismo usuario; hacer `accountId` requerido en el dominio; reemplazar el hardcode de la UI por la cuenta activa real del usuario (sin selector — eso es Story 5.4).

## Boundaries & Constraints

**Always:**
- Migración sigue el patrón de `supabase/migrations/20260828120000_add_transactions_categories_fk.sql`: una transacción SQL, `for update` preventivo, backfill de filas con `account_id` NULL/no-UUID hacia la cuenta `type='cash'` del mismo `user_id`, validar que no queden NULLs, `alter column ... type uuid`, `set not null`, FK `on delete restrict`, índice btree.
- `Transaction.accountId` requerido (sin `?`) en `src/domain/entities/transaction.ts`.
- `transaction-form.tsx` reemplaza `accountId: 'acc-1'` por la primera cuenta de `getActiveAccounts()` — sin UI de selección.
- Regenerar `src/lib/supabase/database.types.ts`.

**Ask First:**
- `getActiveAccounts()` vacío al crear una transacción (usuario desactivó su única cuenta): ¿bloquear con error o crear "Efectivo" al vuelo?
- Backfill encuentra un `user_id` sin cuenta `cash` (no debería pasar tras el backfill/trigger de 5.1): ¿abortar la migración (default sugerido) o crearla inline?

**Never:**
- No agregar `accountId` a `updateTransactionSchema` ni al modo edición — reasignar cuenta es Story 5.4.
- No agregar selector visual de cuenta — Story 5.4.
- No validar pertenencia de `accountId` al usuario más allá de la FK — mismo patrón ya usado por `categoryId`, no es regresión nueva.
- No tocar la rama `update()` de `account_id` en `ApiTransactionRepository` — sigue sin uso, fuera de alcance.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Crear transacción, cuenta activa existente | flujo normal | `accountId` = primera cuenta activa, insert exitoso | N/A |
| Migración sobre fila legacy sin cuenta válida | `account_id` NULL o no-UUID | Backfill la asigna a "Efectivo" del mismo `user_id` antes del `NOT NULL` | Si el `user_id` no tiene cuenta `cash`, la migración aborta |
| Hard-delete de cuenta con transacciones | bypass del soft-delete de `deleteAccount` | Bloqueado por `ON DELETE RESTRICT` (backstop) | Error de FK propagado |
| Crear transacción sin cuenta activa | usuario sin cuentas activas | Ver "Ask First" | Mensaje de error claro, no crash |

</frozen-after-approval>

## Code Map

- `supabase/migrations/<timestamp>_add_transactions_accounts_fk.sql` (nuevo) -- replicar `20260828120000_add_transactions_categories_fk.sql`
- `src/domain/entities/transaction.ts` -- quitar `?` de `accountId`
- `src/infrastructure/repositories/api-transaction.repository.ts` (`create` ~L164-187) -- quitar fallback `?? null`; no tocar `update` (~L189-221)
- `src/app/transactions/actions.ts` (`createTransactionSchema` L15-28) -- `accountId` ya requerido, sin cambios
- `src/app/accounts/actions.ts` (`getActiveAccounts`) -- reutilizar desde `transaction-form.tsx`
- `src/presentation/components/transactions/transaction-form.tsx` (~L77) -- reemplazar hardcode por `getActiveAccounts()[0]`
- `src/lib/supabase/database.types.ts` -- regenerar (falta tabla `accounts`; `transactions.account_id` sigue `string | null`)

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/20260830120000_add_transactions_accounts_fk.sql` -- backfill + `NOT NULL` + FK `ON DELETE RESTRICT` + índice -- núcleo de la historia. **Escrita pero NO aplicada**: el MCP de Supabase rechazó la conexión (`password authentication failed for user "postgres"`) de forma persistente durante la sesión; requiere aplicarse manualmente (`supabase db push` o MCP) antes de mergear.
- [x] `src/domain/entities/transaction.ts` -- `accountId` requerido -- refleja invariante de la DB
- [x] `src/infrastructure/repositories/api-transaction.repository.ts` -- simplificar `create` -- coherente con `accountId` requerido
- [x] `src/presentation/components/transactions/transaction-form.tsx` -- resolver `accountId` real vía `getActiveAccounts()` -- evita que el insert falle contra Supabase
- [x] `src/lib/supabase/database.types.ts` -- regenerado manualmente (no vía MCP, por el fallo de conexión arriba) -- añadida tabla `accounts` y `transactions.account_id: string` (no nullable) con su FK; verificar contra el schema real una vez se pueda usar `generate_typescript_types`

**Acceptance Criteria:**
- Given la migración corre sobre datos existentes, when hay transacciones con `account_id` NULL o inválido, then quedan asignadas a la cuenta "Efectivo" del mismo usuario antes del `NOT NULL`.
- Given un usuario con al menos una cuenta activa, when crea una transacción, then se guarda con un `account_id` real, no `'acc-1'`.
- Given `DATA_SOURCE=api`, when se llama `createTransaction`, then el insert no falla por violación de FK.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: sin errores de tipos
- `npm run build` -- expected: build exitoso
- Migración aplicada (local o MCP Supabase) -- expected: cero filas con `account_id` NULL, FK activa

**Manual checks (if no CLI):**
- Con `DATA_SOURCE=api`, crear una transacción real y confirmar en Supabase que `account_id` apunta a una cuenta existente del usuario.
- Insertar vía SQL directo una transacción con `account_id` inexistente y confirmar que la FK la rechaza.
