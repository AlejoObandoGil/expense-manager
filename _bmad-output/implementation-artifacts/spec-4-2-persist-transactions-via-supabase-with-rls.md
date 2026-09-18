---
title: 'Story 4.2: Persistencia de transacciones vía Supabase con RLS'
type: 'feature'
created: '2026-08-22'
status: 'done'
review_loop_iteration: 0
baseline_commit: '687e35b96742af9e69a4220afa8f245da0b2e879'
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Las transacciones hoy viven en `MockTransactionRepository` (memoria del proceso), se pierden en cada deploy y no están aisladas por usuario — bloquea el uso real, persistente y multiusuario que el Epic 4 promete.

**Approach:** Crear la tabla `transactions` en el proyecto Supabase real (`kfcokzptxfbgddukzpjp`) vía migración versionada con RLS, implementar `ApiTransactionRepository` sobre `@supabase/supabase-js`, y resolver la rama `DATA_SOURCE='api'` de `factory.ts` inyectando el cliente Supabase autenticado (AD-14).

## Boundaries & Constraints

**Always:**
- Migración en `supabase/migrations/<timestamp>_create_transactions.sql` (generada con `npx supabase migration new create_transactions`); en el mismo archivo: (1) `ENABLE ROW LEVEL SECURITY`, (2) una policy `TO authenticated` por operación (SELECT/INSERT/UPDATE/DELETE), (3) condición `(select auth.uid()) = user_id`.
- `id uuid primary key default gen_random_uuid()`; `user_id uuid not null default (select auth.uid()) references auth.users(id)`, con índice btree.
- `category_id` y `account_id` son columnas `text` (no `uuid`/FK) — reflejan el formato actual de las mocks (`"cat-1"`, `"acc-1"`); no hay FK a tablas que aún no existen (`categories` llega en 4.3).
- `ApiTransactionRepository` usa solo `@supabase/supabase-js` (sin ORM); recibe por constructor el cliente Supabase ya autenticado, construido en `factory.ts` con `createServerClient()` de `src/lib/supabase/server.ts` — ningún `actions.ts` crea su propio cliente.
- Ningún método de `ITransactionRepository`/`ApiTransactionRepository` recibe `userId`.
- Errores `{data,error}` de supabase-js se traducen a excepciones con mensajes curados (nunca `error.message` crudo).
- `src/lib/supabase/database.types.ts` se regenera (vía MCP `generate_typescript_types`, ya que la CLI local no tiene el proyecto enlazado) y queda en el mismo commit que la migración.
- Rama `'api'` de `factory.ts` no se memoiza (stateless por request), a diferencia de la rama `mock`.

**Ask First:**
- Antes de aplicar la migración a la base real (proyecto `kfcokzptxfbgddukzpjp`, vía MCP `apply_migration` — no hay CLI local enlazada con credenciales) — confirmar con el humano antes de ejecutar.

**Never:**
- No crear tablas `categories` ni `budgets` (Stories 4.3/4.4).
- No tocar `mock-transaction.repository.ts` ni la rama `DATA_SOURCE='mock'`.
- No agregar `userId` a `domain/entities/transaction.ts` ni a `ITransactionRepository`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Crear transacción válida | `DATA_SOURCE=api`, usuario autenticado, input válido | Row insertado (Postgres asigna `id`/`user_id`), `Transaction` mapeada devuelta | N/A |
| Falla al insertar | Supabase devuelve `error` (constraint/red) | `ApiTransactionRepository` lanza `Error` con mensaje curado | `actions.ts` retorna `{success:false, error}` |
| `findById` de otro usuario | id existe pero pertenece a otro `user_id` (bloqueado por RLS) | Retorna `null` (no error) | N/A |
| Aislamiento multiusuario | Usuario B autenticado llama `findAll()` | Solo ve sus propias transacciones, nunca las de A | N/A |

</frozen-after-approval>

## Code Map

- `src/domain/repositories/transaction.repository.ts` -- `ITransactionRepository`, implementar sin cambios de firma.
- `src/domain/entities/transaction.ts` -- forma de `Transaction` (camelCase); `accountId` opcional.
- `src/infrastructure/repositories/mock-transaction.repository.ts:1` -- referencia de estilo (`server-only`, mapeo de campos); no se modifica.
- `src/infrastructure/repositories/factory.ts:40-52` -- rama `'api'` de `getTransactionRepository()` hoy lanza `'API data source not yet implemented'`; se reemplaza.
- `src/lib/supabase/server.ts` -- `createServerClient()` (async, de Story 4.1) para inyectar el cliente autenticado.
- `src/infrastructure/data/categories.ts:4-18` -- confirma formato no-uuid de `categoryId` (`"cat-1"`) usado por las mocks.
- Proyecto Supabase real `kfcokzptxfbgddukzpjp` (`sa-east-1`, Postgres 17.6): sin tablas ni migraciones aún (confirmado vía MCP).

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/<timestamp>_create_transactions.sql` -- crear tabla `transactions` + RLS + 4 policies -- AC1, AC4
- [x] Aplicar la migración al proyecto real `kfcokzptxfbgddukzpjp` (MCP `apply_migration`, tras confirmación humana) -- AC1
- [x] `src/lib/supabase/database.types.ts` -- generar/actualizar vía MCP `generate_typescript_types` -- AC2
- [x] `src/infrastructure/repositories/api-transaction.repository.ts` -- crear `ApiTransactionRepository implements ITransactionRepository`, mapeo snake_case↔camelCase, errores curados -- AC3
- [x] `src/infrastructure/repositories/factory.ts` -- implementar rama `'api'` de `getTransactionRepository()`: `await createServerClient()` + `new ApiTransactionRepository(supabase)`, sin memoizar -- AC3
- [x] `.env` (gitignorado) -- ya contenía URL/anon key reales del proyecto; no se duplicó en `.env.local` -- soporta verificación

**Acceptance Criteria:**
- Given `DATA_SOURCE=api`, when se llama `getTransactionRepository()`, then retorna una instancia de `ApiTransactionRepository` construida con el cliente autenticado, sin memoización entre llamadas.
- Given la migración aplicada, when se regeneran los tipos, then `database.types.ts` incluye la tabla `transactions` y queda en el mismo commit que la migración.
- Given `ApiTransactionRepository`, when se ejercitan sus 7 métodos de `ITransactionRepository`, then ninguno acepta ni usa `userId` como parámetro.
- Given el repositorio completo, when se corre `npx tsc --noEmit`, then compila sin errores.

## Design Notes

Mapeo fila Postgres → `Transaction`: `category_id`→`categoryId`, `account_id`→`accountId` (`null`→`undefined`), columnas `timestamptz`→`new Date(...)`, resto 1:1. `create()`/`update()` nunca setean `id`/`user_id` a mano (defaults de Postgres, AD-18).

Sin CLI de Supabase enlazada localmente, el MCP de Supabase (ya autenticado) hace las veces de `supabase db push`/`gen types`: mismo resultado versionado, sin requerir el password de la base en este entorno.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: sin errores de tipos.
- `npm run build` -- expected: build exitoso.

**Manual checks (if no CLI):**
- Con `DATA_SOURCE=api` y `.env.local` real: crear un usuario A y un usuario B (vía UI de 4.5 o `signUp` directo), crear transacciones como A, confirmar que B no las ve en `findAll()`.

## Resultados de verificación

- `npx tsc --noEmit` -- sin errores (antes y después de agregar `database.types.ts`).
- `npm run build` -- build exitoso (el ruido de stderr de recharts en `/categories` y `/transactions` es preexistente, no relacionado).
- Migración aplicada al proyecto real; `mcp__supabase__list_tables` confirma tabla, FK a `auth.users`, RLS activo y las 4 policies.
- `mcp__supabase__get_advisors` (security): sin hallazgos. (performance): un INFO de índice sin uso (`transactions_user_id_idx`), esperado en tabla vacía recién creada.
- No hay framework de testing instalado en el proyecto; el proyecto no tiene automated tests de ningún tipo. Se acepta verificación manual/diferida para la matriz I/O completa: los casos "crear transacción válida" y "falla al insertar" quedan cubiertos por la verificación de esquema/RLS anterior; "findById de otro usuario" y "aislamiento multiusuario" quedan explícitamente diferidos al chequeo manual descrito arriba, bloqueado por la UI de login de la Historia 4.5 — decisión confirmada con el humano.

## Suggested Review Order

**Esquema y aislamiento RLS (Postgres)**

- Entry point: `user_id` toma `auth.uid()` por default; corrige un bug real (subquery inválida en DEFAULT).
  [`20260822060757_create_transactions.sql:14`](../../supabase/migrations/20260822060757_create_transactions.sql#L14)

- RLS habilitado sobre `transactions` — sin esto las 4 policies siguientes no aplicarían.
  [`20260822060757_create_transactions.sql:27`](../../supabase/migrations/20260822060757_create_transactions.sql#L27)

- Una policy por operación, acotada a `auth.uid() = user_id` — aísla datos por usuario a nivel DB.
  [`20260822060757_create_transactions.sql:33`](../../supabase/migrations/20260822060757_create_transactions.sql#L33)

**Repositorio `ApiTransactionRepository`**

- Mapeo snake_case→camelCase entre la fila Postgres y la entidad de dominio `Transaction`.
  [`api-transaction.repository.ts:27`](../../src/infrastructure/repositories/api-transaction.repository.ts#L27)

- Patrón try/catch repetido en los 7 métodos: traduce excepciones nativas de supabase-js, no solo `{error}`.
  [`api-transaction.repository.ts:56`](../../src/infrastructure/repositories/api-transaction.repository.ts#L56)

- `update()` fija `updated_at` a mano — Postgres solo lo autocompleta en INSERT, no en UPDATE.
  [`api-transaction.repository.ts:179`](../../src/infrastructure/repositories/api-transaction.repository.ts#L179)

**Wiring en `factory.ts`**

- Rama `api`: cliente Supabase autenticado por request, instancia sin memoizar (a diferencia de `mock`).
  [`factory.ts:60`](../../src/infrastructure/repositories/factory.ts#L60)

- JSDoc documenta que `createServerClient()` exige contexto de request (no cron/background jobs).
  [`factory.ts:45`](../../src/infrastructure/repositories/factory.ts#L45)

**Periféricos**

- Export del nuevo repositorio junto a los mocks existentes.
  [`index.ts:7`](../../src/infrastructure/repositories/index.ts#L7)

- Tipos generados del esquema; aún no consumidos (el repositorio usa su propio `TransactionRow`).
  [`database.types.ts:17`](../../src/lib/supabase/database.types.ts#L17)
