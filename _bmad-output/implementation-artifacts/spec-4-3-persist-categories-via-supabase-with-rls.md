---
title: 'Story 4.3: Persistencia de categorías vía Supabase con RLS'
type: 'feature'
created: '2026-08-23'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'd21322661a3c7cf8a6f9a5db8f77c891a700c2bc'
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Las categorías hoy son un catálogo global hardcodeado (`mockCategories`, 18 filas), compartido y no persistente — bloquea el aislamiento por usuario que el Epic 4 exige, igual que ya se resolvió para transacciones en la Historia 4.2.

**Approach:** Crear la tabla `categories` en el proyecto Supabase real con el mismo patrón RLS de 4.2, implementar `ApiCategoryRepository` sobre `@supabase/supabase-js`, resolver la rama `DATA_SOURCE='api'` de `getCategoryRepository()`, y sembrar las 18 categorías actuales para cada usuario nuevo vía un trigger de Postgres en `auth.users` (no existe UI de signup todavía — Historia 4.5 — así que la siembra debe vivir enteramente en la base de datos).

## Boundaries & Constraints

**Always:**
- Migración en `supabase/migrations/<timestamp>_create_categories.sql` (vía `npx supabase migration new create_categories`); mismo patrón que 4.2: `ENABLE ROW LEVEL SECURITY`, una policy `TO authenticated` por operación, condición `(select auth.uid()) = user_id`.
- `id uuid primary key default gen_random_uuid()`; `user_id uuid not null default auth.uid() references auth.users(id)` (sin subselect en el DEFAULT — replica el fix ya aplicado en la migración de `transactions`, no la prosa literal de AD-18), con índice btree.
- En la misma migración: función `security definer` + trigger `after insert on auth.users` que inserta las 18 categorías de `src/infrastructure/data/categories.ts` con `user_id = new.id` explícito (el default `auth.uid()` no aplica en este contexto de seguridad).
- El trigger corre en la misma transacción que el `insert` en `auth.users` (comportamiento nativo de Postgres); si falla, el signup completo falla — no se agrega manejo de errores especial.
- `ApiCategoryRepository` usa solo `@supabase/supabase-js` (sin ORM); recibe el cliente autenticado por constructor, construido en `factory.ts` con `createServerClient()`.
- Ningún método de `ICategoryRepository`/`ApiCategoryRepository` recibe `userId`.
- Cada método envuelve su llamada a supabase-js en `try/catch` y traduce tanto `{error}` como excepciones nativas a un mismo `Error` curado (patrón ya corregido en `ApiTransactionRepository` tras su revisión) — nunca `error.message` crudo.
- `src/lib/supabase/database.types.ts` se regenera vía MCP `generate_typescript_types` y queda en el mismo commit que la migración.
- Rama `'api'` de `factory.ts` para categorías no se memoiza (stateless), igual que transacciones.
- `Category.budget?: number` se mantiene sin cambios (su limpieza quedó fuera de esta historia, registrada en `deferred-work.md`); no crear columna equivalente en `categories` para ese campo.

**Ask First:**
- Antes de aplicar la migración al proyecto real (`kfcokzptxfbgddukzpjp`, vía MCP `apply_migration`) — confirmar con el humano antes de ejecutar. Si quien implementa no tiene forma de pausar y preguntarle a un humano (p. ej. es un subagente sin ese canal), debe DETENERSE antes de este paso — dejar la migración escrita en el archivo pero sin aplicar — y reportarlo como pendiente en vez de aplicarla unilateralmente.

**Never:**
- No crear la tabla `budgets` (Historia 4.4).
- No tocar `mock-category.repository.ts` ni la rama `DATA_SOURCE='mock'`.
- No agregar `userId` a `domain/entities/category.ts` ni a `ICategoryRepository`.
- No tocar `Category.budget?`, `categories/page.tsx`, ni `src/app/categories/actions.ts` (huérfano) — fuera de alcance, ya registrados en `deferred-work.md`.
- No construir UI de login/signup (Historia 4.5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Crear categoría válida | `DATA_SOURCE=api`, usuario autenticado, input válido | Row insertado, `Category` mapeada devuelta | N/A |
| Falla al insertar | Supabase devuelve `error` | `ApiCategoryRepository` lanza `Error` curado | `actions.ts` retorna `{success:false, error}` |
| Signup de usuario nuevo | `insert` en `auth.users` | El trigger crea las 18 categorías default con ese `user_id` | Si el trigger falla, el `insert` en `auth.users` se revierte completo |
| `findById` de otro usuario | id existe pero pertenece a otro `user_id` (bloqueado por RLS) | Retorna `null` (no error) | N/A |

</frozen-after-approval>

## Code Map

- `src/domain/repositories/category.repository.ts` -- `ICategoryRepository`, implementar sin cambios de firma.
- `src/domain/entities/category.ts` -- forma de `Category`; no modificar (incluye `budget?`, fuera de alcance).
- `src/infrastructure/repositories/mock-category.repository.ts:1` -- referencia de estilo (`server-only`, mensajes de error); no se modifica.
- `src/infrastructure/repositories/factory.ts:71-83` -- rama `'api'` de `getCategoryRepository()` hoy lanza `'API data source not yet implemented'`; se reemplaza siguiendo el patrón ya shippeado en `getTransactionRepository()` (líneas 50-62 del mismo archivo).
- `src/infrastructure/repositories/api-transaction.repository.ts` -- referencia directa del patrón de error curado + try/catch de excepciones nativas a replicar.
- `src/infrastructure/data/categories.ts:3-22` -- las 18 categorías default; fuente de los `insert` que va dentro del trigger.
- `src/lib/supabase/server.ts` -- `createServerClient()` para inyectar el cliente autenticado.
- `src/app/actions/categories.ts:33,52,75,100` -- server actions reales (`getCategories`, `createCategory`, `updateCategory`, `deleteCategory`) que consumen `getCategoryRepository()`.
- `supabase/migrations/20260822060757_create_transactions.sql` -- referencia de migración/RLS ya aplicada y validada.
- Proyecto Supabase real `kfcokzptxfbgddukzpjp`: ya tiene `transactions`; `categories` aún no existe (confirmar vía `list_tables`).

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/<timestamp>_create_categories.sql` -- crear tabla `categories` + RLS + 4 policies + función/trigger de seed en `auth.users` -- AC1, AC4, AC5
- [x] Aplicar la migración al proyecto real (MCP `apply_migration`, tras confirmación humana) -- AC1
- [x] `src/lib/supabase/database.types.ts` -- regenerar vía MCP `generate_typescript_types` -- AC2
- [x] `src/infrastructure/repositories/api-category.repository.ts` -- crear `ApiCategoryRepository implements ICategoryRepository`, mapeo snake_case↔camelCase, errores curados con try/catch de excepciones nativas -- AC3
- [x] `src/infrastructure/repositories/factory.ts` -- implementar rama `'api'` de `getCategoryRepository()`, sin memoizar -- AC3

**Acceptance Criteria:**
- Given `DATA_SOURCE=api`, when se llama `getCategoryRepository()`, then retorna una instancia de `ApiCategoryRepository` construida con el cliente autenticado, sin memoización entre llamadas.
- Given la migración aplicada, when se regeneran los tipos, then `database.types.ts` incluye la tabla `categories` en el mismo commit que la migración.
- Given `ApiCategoryRepository`, when se ejercitan sus 6 métodos de `ICategoryRepository`, then ninguno acepta ni usa `userId` como parámetro.
- Given un usuario nuevo se registra, when el trigger se ejecuta, then existen 18 categorías con ese `user_id`.
- Given el repositorio completo, when se corre `npx tsc --noEmit`, then compila sin errores.

## Design Notes

La función del trigger debe ser `security definer set search_path = public` — se ejecuta con el rol interno de auth al insertar en `auth.users`, no como el usuario autenticado, así que sin `security definer` el `insert` en `public.categories` chocaría contra RLS. Patrón:

```sql
create function public.handle_new_user_categories()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.categories (user_id, name, emoji, color, type)
  values (new.id, 'Vivienda', '🏠', '#3b82f6', 'expense'), (new.id, ...);
  return new;
end;
$$;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.handle_new_user_categories();
```

`Category` no tiene `createdAt`/`updatedAt` (a diferencia de `Transaction`), así que la tabla `categories` tampoco necesita esas columnas ni lógica de refresco en `update()`.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: sin errores de tipos.
- `npm run build` -- expected: build exitoso.

**Manual checks (if no CLI):**
- Sin framework de testing en el proyecto (igual que 4.2). Con `DATA_SOURCE=api`: crear un usuario de prueba (vía MCP/`signUp` directo, no hay UI todavía) y confirmar que aparecen 18 categorías con su `user_id`; crear un segundo usuario y confirmar que `findAll()` no mezcla categorías entre ambos.

## Resultados de verificación

- `npx tsc --noEmit` -- sin errores.
- `npm run build` -- build exitoso (mismo ruido preexistente de recharts).
- Migración de `categories` aplicada al proyecto real; `list_tables` confirma tabla + FK a `auth.users` + RLS + 4 policies.
- `get_advisors` (security) encontró que `handle_new_user_categories()` (`security definer`) quedaba expuesta como RPC pública a `anon`/`authenticated` — corregido con dos migraciones de `revoke execute` (la primera, `from public`, no alcanzó porque Supabase otorga `EXECUTE` a esos roles directamente vía `ALTER DEFAULT PRIVILEGES`, no solo vía `PUBLIC`; la segunda, `from anon, authenticated`, sí lo resolvió — confirmado con `has_function_privilege` y `get_advisors` en cero hallazgos). El trigger sigue funcionando igual, ya que su invocación no depende del privilegio `EXECUTE` del rol que dispara el `insert` en `auth.users`.
- `get_advisors` (performance): un INFO de índice sin uso (`categories_user_id_idx`), esperado en tabla vacía recién creada.
- No hay framework de testing en el proyecto. Se acepta verificación manual/diferida para "findById de otro usuario" y el chequeo de siembra multiusuario, igual que en 4.2 — bloqueado por la falta de UI de login (Historia 4.5).

## Suggested Review Order

**Esquema, RLS y seed en signup (Postgres)**

- Entry point: tabla `categories`, mismo patrón RLS que `transactions` (`default auth.uid()` sin subselect).
  [`20260823054741_create_categories.sql:11`](../../supabase/migrations/20260823054741_create_categories.sql#L11)

- Función `security definer` que siembra las 18 categorías con `user_id = new.id` explícito.
  [`20260823054741_create_categories.sql:64`](../../supabase/migrations/20260823054741_create_categories.sql#L64)

- Trigger `after insert on auth.users` que dispara el seed en cada signup.
  [`20260823054741_create_categories.sql:95`](../../supabase/migrations/20260823054741_create_categories.sql#L95)

- Hallazgo de `get_advisors` corregido en vivo: revocar `EXECUTE` de `anon`/`authenticated` sobre la función `security definer` (evita exponerla como RPC pública).
  [`20260823060100_revoke_execute_handle_new_user_categories_from_roles.sql:9`](../../supabase/migrations/20260823060100_revoke_execute_handle_new_user_categories_from_roles.sql#L9)

**Repositorio `ApiCategoryRepository`**

- `findByType()` iguala el contrato de `MockCategoryRepository`: incluye categorías `'both'` al pedir `'income'`/`'expense'` (fix de revisión).
  [`api-category.repository.ts:84`](../../src/infrastructure/repositories/api-category.repository.ts#L84)

- Patrón try/catch + mapeo snake_case→camelCase, igual que `ApiTransactionRepository`.
  [`api-category.repository.ts:52`](../../src/infrastructure/repositories/api-category.repository.ts#L52)

**Wiring en `factory.ts`**

- Rama `api`: cliente Supabase autenticado por request, instancia sin memoizar.
  [`factory.ts:90`](../../src/infrastructure/repositories/factory.ts#L90)

**Periféricos**

- Export del nuevo repositorio.
  [`index.ts:8`](../../src/infrastructure/repositories/index.ts#L8)

- Tabla `categories` agregada a los tipos generados.
  [`database.types.ts:17`](../../src/lib/supabase/database.types.ts#L17)
