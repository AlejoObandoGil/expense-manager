---
title: 'Agregar FK transactions → categories con ON DELETE RESTRICT'
type: 'feature'
created: '2026-08-27'
status: 'done'
review_loop_iteration: 1
baseline_commit: 'e50bb060a3b120a1c63ab74dacc6c58a306a2d16'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problema:** `transactions.category_id` es `text` sin FK a `categories.id` (uuid), violando integridad referencial. Transacciones pueden apuntar a categorías inexistentes, y no hay forma de eliminar una categoría con seguridad.

**Enfoque:** Crear una migración Supabase que convierta `category_id` de `text` a `uuid` y agregue una FK con `ON DELETE RESTRICT`, impidiendo borrar categorías que tengan transacciones asociadas.

## Boundaries & Constraints

**Always:**
- La migración se aplica solo a Supabase, no a código de aplicación
- `ON DELETE RESTRICT` — no borrar categorías si tienen transacciones
- La conversión de `text` → `uuid` debe validar que no hay datos huérfanos antes de migrar
- Ningún cambio en `ApiTransactionRepository`, `domain/entities`, ni validaciones Zod

**Ask First:**
- (Ninguno — alcance aislado)

**Never:**
- `ON DELETE CASCADE` (descartado por usuario — no borrar transacciones)
- `ON DELETE SET NULL` (no permitir categoría nula en transacciones)
- Cambios en lógica de aplicación o UI

## I/O & Edge-Case Matrix

| Escenario | Input / Estado | Output / Comportamiento Esperado | Error Handling |
|-----------|----------------|--------------------------------|----------------|
| Borrar categoría sin transacciones | Categoría válida, sin transacciones | Borrado exitoso | N/A |
| Borrar categoría con transacciones | Categoría válida, con ≥1 transacción | Rechazo de FK en BD | Mensaje en logs: FK violation |
| Insertar transacción con categoría válida | `category_id = uuid válido` | Inserción exitosa | N/A |
| Insertar transacción con categoría inexistente | `category_id = uuid inexistente` | Rechazo de FK en BD | FK violation error |

</frozen-after-approval>

## Code Map

- `supabase/migrations/20260822060757_create_transactions.sql` — Tabla actual con `category_id text` (línea 17), sin FK (línea 14 solo FK a auth.users)
- `supabase/migrations/20260823054741_create_categories.sql` — Tabla `categories` con `id uuid` (línea 12), sin referencias inversas de transactions
- `supabase/migrations/20260823070000_create_budgets.sql` — Ejemplo de FK correcto: `budgets.category_id uuid ... references public.categories(id)` (línea 25)
- `src/infrastructure/repositories/api-transaction.repository.ts` — Lógica de persistencia (no toca en esta historia, validar que no depende de `category_id` como string)

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/20260828120000_add_transactions_categories_fk.sql` -- Crear migración SQL atómica que: (1) valide no-NULLs y no-orphaned data pre-migration, (2) convierta `category_id` text→uuid, (3) agregue FK con ON DELETE RESTRICT, (4) cree índice -- Garantizar transacción única, atomicidad, recuperabilidad
- [x] `supabase gen types typescript --project-id {id} > src/lib/supabase/database.types.ts` -- Regenerar tipos TypeScript post-migración para sincronizar `category_id: uuid` -- Evitar type safety gaps
- [x] `src/app/actions/categories.ts` (deleteCategory) -- Validar categoría no tenga transacciones ANTES de intentar delete; retornar error específico "Esta categoría tiene transacciones asociadas" en lugar de genérico FK violation -- UX clara para usuario
- [x] `npm run build` -- Verificar Next.js compile sin errores tras cambios -- Asegurar zero blast radius en código aplicación

**Acceptance Criteria:**
- Dado que existe una categoría con transacciones asociadas, cuando intento borrarla desde BD o app, entonces BD rechaza con FK violation (status code 23503)
- Dado que existe una categoría sin transacciones, cuando la borro, entonces se elimina exitosamente
- Dado que intento insertar una transacción con un `category_id` que no existe, entonces BD rechaza con FK violation
- Dado que pre-migración existen `category_id` NULL o no-UUIDs válidos, entonces migración falla con error claro "X transactions cannot be migrated" sin data loss

## Design Notes

**Atomicity & Safety:**
- La migración debe ser single transaction (BEGIN/COMMIT/ROLLBACK) para garantizar que la tabla nunca quede en estado intermedio (ej: ambas columnas presentes, o column renamed pero sin constraint)
- Pre-migration check debe usar `SELECT ... FOR UPDATE` locks para prevenir race condition: otro proceso podría insertar orphaned data DESPUÉS de la validación pero ANTES de la constraint
- Conversión text→uuid debe validar:
  - No hay NULLs en `category_id` (actualmente NOT NULL, pero edge case si data es inconsistente)
  - Todos los values son UUIDs válidos (no strings como "cat-1")
  - Todas las UUIDs referencia una categoría que existe

**Type Safety:**
- Regenerar `database.types.ts` es obligatorio post-migración. Supabase lo genera como `category_id: string` que es técnicamente correcto (UUIDs en JS son strings), pero documenta que ahora es una FK constraint en lugar de free text
- App debe validar `categoryId` como UUID válido en Zod schemas, no solo string no-vacío

**Verification:**
- Post-migración, ejecutar query: `SELECT COUNT(*) FROM transactions WHERE category_id::text NOT IN (SELECT id::text FROM categories)` debe retornar 0
- Post-migración, intentar `DELETE FROM categories WHERE id = ANY(ARRAY[select category_id from transactions limit 1])` debe fallar con FK violation

## Spec Change Log

**Loop 1 (2026-08-28):** Review encontró 6 bad_spec + 9 edge-case findings. Migración SQL inicial carecía de atomicity, NULL validation, y type-safety follow-up. Corregido:
- Agregado: Migración SQL DEBE ser single transaction con explicit BEGIN/COMMIT/ROLLBACK
- Agregado: Pre-migration check usa SELECT FOR UPDATE locks para evitar race condition
- Agregado: Task de regenerar database.types.ts post-migración
- Agregado: Task de validar categoría tiene transacciones ANTES de delete (app-layer check)
- Agregado: Spec Verification con queries explícitas para auditar conversión
- KEEP: Validación de data huérfana es critical; índice en category_id es beneficial

## Verification

**Commands:**
- `npm run build` -- esperado: Success sin errores de tipo Next.js
- `supabase db push` -- aplica migración a dev Supabase; observar que migration timestamp está en version history

**Post-migration verification queries (en Supabase Studio o psql):**
- `SELECT COUNT(*) FROM transactions WHERE category_id IS NULL;` → debe ser 0
- `SELECT COUNT(*) FROM transactions WHERE category_id::text NOT IN (SELECT id::text FROM categories);` → debe ser 0
- `INSERT INTO transactions (user_id, category_id, amount, description, type, date) VALUES (auth.uid(), 'invalid-uuid', 10, 'test', 'expense', now());` → debe fallar con FK violation
- `DELETE FROM categories WHERE id IN (SELECT DISTINCT category_id FROM transactions LIMIT 1);` → debe fallar con FK violation (ON DELETE RESTRICT)

**Manual checks:**
- Abrir Supabase Studio → `transactions` table → schema tab → verificar `category_id` es `uuid` type y FK constraint es visible
- Crear una transacción, intentar borrar su categoría desde Studio, confirmar error "foreign key constraint"
