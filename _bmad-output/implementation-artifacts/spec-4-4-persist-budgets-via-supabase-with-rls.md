---
title: 'Story 4.4: Persistencia de presupuestos vía Supabase con RLS'
type: 'feature'
created: '2026-08-23'
status: 'done'
review_loop_iteration: 0
baseline_commit: '50e0bca7cd7ebcccfed1fac62b9ecb75f7b9288f'
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Los presupuestos hoy son 3 registros hardcodeados en memoria (`mockBudgets`), no persistentes ni privados por usuario — bloquea el aislamiento por usuario que exige Epic 4, igual que ya se resolvió para transacciones (4.2) y categorías (4.3).

**Approach:** Crear la tabla `budgets` en Supabase con el mismo patrón RLS ya establecido, con `category_id uuid` como FK real a `categories.id` (a diferencia de `transactions.category_id`, que sigue en `text` sin FK — decisión explícita para esta tabla nueva), implementar `ApiBudgetRepository` sobre `@supabase/supabase-js`, y resolver la rama `DATA_SOURCE='api'` de `getBudgetRepository()`.

## Boundaries & Constraints

**Always:**
- Migración en `supabase/migrations/<timestamp>_create_budgets.sql`; mismo patrón que 4.2/4.3: `ENABLE ROW LEVEL SECURITY`, una policy `TO authenticated` por operación, condición `(select auth.uid()) = user_id`.
- `id uuid primary key default gen_random_uuid()`; `user_id uuid not null default auth.uid() references auth.users(id)` (sin subselect en el DEFAULT, igual que 4.2/4.3), con índice btree.
- `category_id uuid not null references public.categories(id)` — FK real (tabla nueva, no arrastra el formato `text` heredado de `transactions.category_id`, que queda fuera de alcance).
- `unique (user_id, category_id, month, year)` — evita presupuestos duplicados para la misma categoría/mes/año; protege la semántica de `getBudgetForCategory` (`MockBudgetRepository` ya asume un único match).
- `amount numeric not null check (amount > 0)`; `spent numeric not null default 0 check (spent >= 0)`; `month int not null check (month between 1 and 12)`; `year int not null`.
- `ApiBudgetRepository` usa solo `@supabase/supabase-js` (sin ORM); recibe el cliente autenticado por constructor, construido en `factory.ts` con `createServerClient()`.
- Ningún método de `IBudgetRepository`/`ApiBudgetRepository` recibe `userId`.
- Cada método envuelve su llamada a supabase-js en `try/catch` y traduce tanto `{error}` como excepciones nativas a un `Error` curado (mismo patrón que `ApiTransactionRepository`/`ApiCategoryRepository`).
- `remaining` y `percentageUsed` NO son columnas en `budgets` — se calculan al mapear fila→`Budget` (`remaining = amount - spent`, `percentageUsed = (spent / amount) * 100`), igual que hoy hace `MockBudgetRepository.createBudget`/`updateBudget`, para no persistir datos derivados que puedan desincronizarse.
- `getBudgetForCategory` usa `.maybeSingle()` (no `.single()`) para devolver `null` sin lanzar cuando no hay match.
- `src/lib/supabase/database.types.ts` se regenera vía MCP `generate_typescript_types` y queda en el mismo commit que la migración.
- Rama `'api'` de `factory.ts` para presupuestos no se memoiza (stateless), igual que transacciones/categorías.

**Ask First:**
- Antes de aplicar la migración al proyecto real (`kfcokzptxfbgddukzpjp`, vía MCP `apply_migration`) — confirmar con el humano antes de ejecutar. Si quien implementa no tiene forma de pausar y preguntarle a un humano (p. ej. es un subagente sin ese canal), debe DETENERSE antes de este paso — dejar la migración escrita en el archivo pero sin aplicar — y reportarlo como pendiente en vez de aplicarla unilateralmente.

**Never:**
- No modificar `transactions` ni agregarle FK a `category_id` (fuera de alcance, ya registrado en `deferred-work.md`).
- No tocar `mock-budget.repository.ts` ni la rama `DATA_SOURCE='mock'`.
- No agregar `userId` a `domain/entities/budget.ts` ni a `IBudgetRepository`.
- No modificar `GetBudgetStatusUseCase` (Epic 3) — su cálculo de `isNearLimit`/`isOverBudget` sigue operando igual sobre el `Budget` que retorna el repositorio.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Crear presupuesto válido | `DATA_SOURCE=api`, usuario autenticado, `categoryId` propio existente | Row insertado, `Budget` mapeado con `remaining`/`percentageUsed` calculados | N/A |
| Presupuesto duplicado | `insert` viola `unique (user_id, category_id, month, year)` | `ApiBudgetRepository` lanza `Error` curado | `actions.ts` retorna `{success:false, error}` |
| `getBudgetForCategory` sin match | No existe presupuesto para esa categoría/mes/año | Retorna `null` (no error) | N/A |
| `categoryId` de otro usuario | FK a `categories.id` no valida ownership (los checks de FK no respetan RLS) | El `insert` puede tener éxito aunque la categoría sea ajena | Limitación aceptada, documentada en Design Notes — no se agrega trigger de validación en esta historia |

</frozen-after-approval>

## Code Map

- `src/domain/repositories/budget.repository.ts` -- `IBudgetRepository`, implementar sin cambios de firma.
- `src/domain/entities/budget.ts` -- forma de `Budget` (`id, categoryId, amount, month, year, spent, remaining, percentageUsed`).
- `src/infrastructure/repositories/mock-budget.repository.ts:38-90` -- referencia de estilo y de la aritmética `remaining`/`percentageUsed` a replicar; no se modifica.
- `src/infrastructure/repositories/api-category.repository.ts` -- referencia directa del patrón de error curado + try/catch de excepciones nativas + mapeo snake_case↔camelCase a replicar.
- `src/infrastructure/repositories/factory.ts:101-113` -- rama `'api'` de `getBudgetRepository()` hoy lanza `'API data source not yet implemented'`; se reemplaza siguiendo el patrón ya shippeado para transacciones/categorías.
- `src/domain/usecases/budgets/get-budget-status.ts` -- consumidor de `getBudgetForCategory`; no se modifica.
- `src/app/budgets/actions.ts:10-19,66-88` -- `createBudgetSchema`/`createBudget` ya validan y pasan `spent` como input manual (no hay cálculo automático desde transacciones reales); confirma que `spent` es un valor persistido, no derivado en runtime.
- `supabase/migrations/20260823054741_create_categories.sql` -- referencia de migración/RLS ya aplicada; `categories.id` es el target de la nueva FK.
- Proyecto Supabase real `kfcokzptxfbgddukzpjp`: ya tiene `transactions` y `categories`; `budgets` aún no existe (confirmar vía `list_tables`).

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/<timestamp>_create_budgets.sql` -- crear tabla `budgets` + RLS + 4 policies + FK a `categories.id` + `unique (user_id, category_id, month, year)` -- AC1, AC4
- [x] Aplicar la migración al proyecto real (MCP `apply_migration`, tras confirmación humana) -- AC1
- [x] `src/lib/supabase/database.types.ts` -- regenerar vía MCP `generate_typescript_types` -- AC2
- [x] `src/infrastructure/repositories/api-budget.repository.ts` -- crear `ApiBudgetRepository implements IBudgetRepository`, mapeo snake_case↔camelCase, cálculo de `remaining`/`percentageUsed`, errores curados con try/catch de excepciones nativas -- AC3
- [x] `src/infrastructure/repositories/factory.ts` -- implementar rama `'api'` de `getBudgetRepository()`, sin memoizar -- AC3

**Acceptance Criteria:**
- Given `DATA_SOURCE=api`, when se llama `getBudgetRepository()`, then retorna una instancia de `ApiBudgetRepository` construida con el cliente autenticado, sin memoización entre llamadas.
- Given la migración aplicada, when se regeneran los tipos, then `database.types.ts` incluye la tabla `budgets` en el mismo commit que la migración.
- Given `ApiBudgetRepository`, when se ejercitan sus 5 métodos de `IBudgetRepository`, then ninguno acepta ni usa `userId` como parámetro.
- Given dos presupuestos para la misma categoría/mes/año, when se intenta crear el segundo, then la constraint `unique` lo rechaza y se traduce a un `Error` curado.
- Given el repositorio completo, when se corre `npx tsc --noEmit`, then compila sin errores.

## Design Notes

`ApiBudgetRepository.createBudget`/`updateBudget` calculan `remaining`/`percentageUsed` en TypeScript después del `insert`/`update` (usando los valores `amount`/`spent` ya conocidos en memoria, sin una segunda consulta), igual que hace `MockBudgetRepository` hoy — esto no es "cálculo de negocio" en el sentido que evita el epic (eso sigue siendo `isNearLimit`/`isOverBudget` en `GetBudgetStatusUseCase`), es solo aritmética para completar la forma de `Budget` que la interfaz ya exige devolver.

La FK `category_id → categories.id` no impide que un usuario cree un presupuesto apuntando al `id` de una categoría ajena (los constraints de FK en Postgres no respetan RLS) — RLS en `budgets` sigue garantizando que nadie más vea o edite ese presupuesto, pero no valida la propiedad de la categoría referenciada. Se acepta como limitación conocida para esta historia (agregar un trigger de validación sería sobre-ingeniería para un caso de bajo impacto — el usuario solo se referenciaría a sí mismo con datos inconsistentes, no filtra datos ajenos).

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: sin errores de tipos.
- `npm run build` -- expected: build exitoso.

**Manual checks (if no CLI):**
- Sin framework de testing en el proyecto (igual que 4.2/4.3). Con `DATA_SOURCE=api`: crear un presupuesto de prueba, confirmar `remaining`/`percentageUsed` correctos; intentar duplicar categoría/mes/año y confirmar que falla curado.

## Suggested Review Order

**Esquema y RLS**

- Tabla `budgets` nueva: FK real a `categories.id`, `unique(user_id, category_id, month, año)`, RLS con 4 policies por operación.
  [`20260823070000_create_budgets.sql:22`](../../supabase/migrations/20260823070000_create_budgets.sql#L22)

**Repositorio `ApiBudgetRepository`**

- Constructor recibe el cliente Supabase autenticado; ningún método filtra por `userId`, RLS hace el aislamiento.
  [`api-budget.repository.ts:54`](../../src/infrastructure/repositories/api-budget.repository.ts#L54)

- `createBudget` traduce la violación `unique` (`23505`) a un error curado en español.
  [`api-budget.repository.ts:77`](../../src/infrastructure/repositories/api-budget.repository.ts#L77)

- `updateBudget` corta antes de golpear Supabase si el patch queda vacío (hallazgo de revisión, ya corregido).
  [`api-budget.repository.ts:112`](../../src/infrastructure/repositories/api-budget.repository.ts#L112)

- `getAllBudgets` ordena por año/mes descendente para un listado determinístico (hallazgo de revisión, ya corregido).
  [`api-budget.repository.ts:163`](../../src/infrastructure/repositories/api-budget.repository.ts#L163)

**Wiring del factory**

- Rama `'api'` de `getBudgetRepository()` construye `ApiBudgetRepository` sin memoizar, igual que transacciones/categorías.
  [`factory.ts:120`](../../src/infrastructure/repositories/factory.ts#L120)

- Export agregado para `ApiBudgetRepository`.
  [`index.ts:10`](../../src/infrastructure/repositories/index.ts#L10)

**Tipos generados**

- `database.types.ts` regenerado contra el proyecto real: incluye `budgets` con su FK a `categories`.
  [`database.types.ts:17`](../../src/lib/supabase/database.types.ts#L17)
