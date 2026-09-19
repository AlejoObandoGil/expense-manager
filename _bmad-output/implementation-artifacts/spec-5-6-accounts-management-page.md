---
title: 'Accounts Management Page'
type: 'feature'
created: '2026-09-01'
status: 'in-progress'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-5-context.md']
baseline_commit: 'bbea7280000b3befa0b450807d09c5b2a3dc401a'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** El backend de cuentas (Stories 5.1/5.3) ya existe completo (tabla, RLS, server actions), pero no hay ninguna UI para que el usuario cree, vea, edite o elimine sus cuentas.

**Approach:** Crear la página `/accounts` reutilizando los patrones ya establecidos en `categories/page.tsx` (lista tipo grid, modal de formulario) y `transaction-form.tsx` (modal dual crear/editar), consumiendo `src/app/accounts/actions.ts` tal cual existe.

## Boundaries & Constraints

**Always:**
- Reutilizar exactamente los server actions existentes (`getAccounts`, `createAccount`, `updateAccount`, `deleteAccount`) sin modificarlos.
- Un único componente `AccountFormModal` maneja crear y editar vía prop opcional `account?: Account`, siguiendo el patrón dual de `transaction-form.tsx`.
- El balance mostrado en cada tarjeta es `initialBalance` tal cual — no hay balance derivado de transacciones todavía (bloqueado por Story 5.2, fuera de alcance).
- Confirmación de eliminar vía `window.confirm()` nativo, igual que en `transactions/page.tsx`.
- Agregar el item de navegación "Cuentas" en AMBOS `desktop-sidebar.tsx` y `mobile-nav.tsx` (arrays duplicados, deben quedar sincronizados).
- Filtro por `type` y búsqueda por `name` en memoria sobre el array ya cargado (sin re-fetch), igual que en `transactions/page.tsx`.
- La lista carga con `getAccounts()` (incluye inactivas); cuentas con `isActive: false` se muestran con una indicación visual de "Inactiva" (badge o estilo atenuado), sin acción de reactivar.

**Ask First:** Si durante la implementación algún caso de error del soft-delete no está bien cubierto por el mensaje actual de `deleteAccount` y se necesita tocar `actions.ts`.

**Never:**
- No implementar "Ver historial" (link a transacciones filtradas por cuenta) — depende de `account_id` en `transactions` (Story 5.2, no existe todavía). Queda diferido.
- No calcular ni mostrar balance derivado (initialBalance + suma de transacciones) — depende de Story 5.2.
- No modificar `src/app/accounts/actions.ts`, `account.repository.ts`, entidades, ni migraciones — ya están completos y fuera de alcance.
- No agregar botón de "reactivar" cuenta inactiva — fuera de alcance de esta story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Crear cuenta válida | name, type, initialBalance, currency completos | Cuenta aparece en la lista, modal cierra, toast de éxito | N/A |
| Crear cuenta con campo inválido | `initialBalance` negativo o `name` vacío | Errores inline por campo, modal permanece abierto | Error de Zod mapeado por campo (mismo patrón que `create-category-modal.tsx`) |
| Editar cuenta | Cuenta existente + cambios en el form | Lista refleja los cambios tras cerrar el modal, toast de éxito | Igual manejo de errores que crear |
| Eliminar cuenta sin transacciones | Cuenta sin transacciones asociadas | `confirm()` → hard delete → desaparece de la lista | Toast de error si `deleteAccount` falla |
| Eliminar cuenta con transacciones | Cuenta con transacciones asociadas | `confirm()` → soft delete → cuenta se muestra como "Inactiva" en vez de desaparecer | Toast de error si `deleteAccount` falla |
| Filtrar por tipo | Selección en dropdown de tipo | Lista muestra solo cuentas de ese tipo | N/A |
| Buscar por nombre | Texto en input de búsqueda | Lista filtra por coincidencia case-insensitive en `name` | N/A |
| Sin cuentas | Usuario nuevo sin cuentas creadas | Se muestra `EmptyState` invitando a crear la primera cuenta | N/A |

</frozen-after-approval>

## Code Map

- `src/app/categories/page.tsx` -- patrón de referencia: Client Component, `useEffect` + `loadX()` async, grid de tarjetas, modal controlado por `isModalOpen`
- `src/presentation/components/shared/create-category-modal.tsx` -- patrón de modal de formulario: `Dialog` shadcn, `FormData` nativo, errores Zod mapeados por campo, `toast` de `sonner`
- `src/presentation/components/transactions/transaction-form.tsx` -- patrón de modal dual crear/editar vía prop opcional `transaction?`; replicar esa forma para `AccountFormModal`
- `src/app/transactions/page.tsx` (líneas ~62, ~98-134, ~194-216) -- patrón de `window.confirm()` para eliminar, filtros con `<select>` nativo + `useState`, botones de acción con íconos `lucide-react`
- `src/app/accounts/actions.ts` -- ya expone `getAccounts`, `getActiveAccounts`, `createAccount`, `updateAccount` (acepta `isActive` opcional), `deleteAccount`; usar tal cual, no modificar
- `src/domain/entities/account.ts` -- campos: `id`, `name`, `type` ('credit_card'|'checking'|'savings'|'cash'|'investment'), `initialBalance`, `currency`, `isActive`
- `src/presentation/components/shared/desktop-sidebar.tsx` (array `navItems`) -- agregar entrada "Cuentas" → `/accounts`
- `src/presentation/components/shared/mobile-nav.tsx` (array duplicado) -- agregar la misma entrada
- `src/presentation/components/shared/index.ts` -- exportar los nuevos componentes de `accounts/`

## Tasks & Acceptance

**Execution:**
- [x] `src/presentation/components/accounts/account-form-modal.tsx` -- modal dual crear/editar con prop opcional `account?: Account`, `FormData` + validación mapeada desde Zod -- reutiliza convención existente sin backend nuevo
- [x] `src/app/accounts/page.tsx` -- crear página Client Component que carga `getAccounts()`, renderiza grid de tarjetas, maneja estado de filtro/búsqueda, usa `AccountFormModal` -- entrada principal de la feature
- [x] `src/presentation/components/shared/desktop-sidebar.tsx` -- agregar item "Cuentas" a `navItems` -- hace la página descubrible en desktop
- [x] `src/presentation/components/shared/mobile-nav.tsx` -- agregar el mismo item -- consistencia en mobile
- [x] `src/presentation/components/shared/index.ts` -- agregar exports de los nuevos componentes de `accounts/` si se colocan en `shared/` o crear `accounts/index.ts` -- mantener convención de barrel exports (creado `accounts/index.ts` en vez de tocar `shared/`)

**Acceptance Criteria:**
- Given un usuario autenticado navega a `/accounts`, when la página carga, then ve únicamente sus propias cuentas (RLS ya lo garantiza en backend), tanto activas como inactivas.
- Given la lista de cuentas, when el usuario hace click en "Editar" sobre una tarjeta, then se abre `AccountFormModal` precargado con los datos de esa cuenta.
- Given el usuario no tiene cuentas creadas, when la página carga, then se muestra `EmptyState` invitando a crear la primera.
- Given los menús de navegación existentes, when se agrega la nueva entrada, then tanto `desktop-sidebar.tsx` como `mobile-nav.tsx` muestran "Cuentas" de forma consistente con el resto de items.

### Review Findings

- [ ] [Review][Patch] `mapServerError` keyword heuristic fails for edit-mode `name`/`currency` validation errors — resolved decision: add matching custom Spanish messages to `updateAccountSchema` in `actions.ts` (Ask-First approved, touching `actions.ts` is in scope for this fix). [account-form-modal.tsx:60, actions.ts:15]
- [ ] [Review][Patch] Delete toast always says "Cuenta eliminada" even when `deleteAccount` only soft-deactivated the account — resolved decision: client-side workaround only, no `actions.ts` change. After a successful delete, check whether the account is still present in the reloaded list with `isActive: false` and show "Cuenta desactivada" in that case instead of "Cuenta eliminada". [page.tsx:88, actions.ts:90]
- [ ] [Review][Patch] Silent account-type overwrite via `getAccountTypeInfo` fallback on save — if an account's stored `type` isn't one of the 5 known values, opening the edit modal silently defaults the selector to "checking"; submitting without touching Type overwrites the real type with no warning. [account-form-modal.tsx:39]
- [ ] [Review][Patch] `openRef` guard isn't scoped per submit session — a stale in-flight submit can close/toast for a different, later-opened modal session; conversely, cancelling while a save is in flight fully swallows a subsequent success (no toast, no list refresh) since the Cancel button isn't disabled during `loading`. [account-form-modal.tsx:44,259]
- [ ] [Review][Patch] Delete guard (`if (deletingId) return`) blocks starting a delete on any other row while one is in flight, but only the in-flight row's button is visually disabled — clicking a different row is a silent no-op. [page.tsx:81]
- [ ] [Review][Patch] Double-submit guard reads a stale `loading` closure — two submits dispatched in the same tick (e.g. double Enter) can both pass the guard, contrary to the guard's own comment intent. [account-form-modal.tsx:89]

## Spec Change Log

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: sin errores de tipos
- `npm run build` -- expected: build exitoso (confirma que no rompe el límite Server Actions / Client Component)

**Manual checks (if no CLI):**
- Levantar `npm run dev`, navegar a `/accounts`: crear una cuenta, editarla, eliminarla (probar caso con y sin transacciones asociadas si hay datos de prueba), verificar filtro por tipo y búsqueda por nombre, y confirmar que el link "Cuentas" aparece en sidebar desktop y en nav mobile.

## Suggested Review Order

**Flujo principal**

- Página de cuentas: carga, filtro/búsqueda en memoria, wiring de crear/editar/eliminar.
  [`page.tsx:33`](../../src/app/accounts/page.tsx#L33)

- Modal dual crear/editar — punto de entrada de toda la lógica de formulario.
  [`account-form-modal.tsx:31`](../../src/presentation/components/accounts/account-form-modal.tsx#L31)

**Validación y seguridad de envío (parches de la revisión)**

- `noValidate` deja que la validación JS corra en vez de que el navegador la intercepte primero.
  [`account-form-modal.tsx:180`](../../src/presentation/components/accounts/account-form-modal.tsx#L180)

- `Number.isFinite` (no solo `isNaN`) rechaza `Infinity`/`NaN` y redondea a 2 decimales antes de enviar.
  [`account-form-modal.tsx:104`](../../src/presentation/components/accounts/account-form-modal.tsx#L104)

- Guard `if (loading) return` bloquea doble-submit antes de que el estado se actualice.
  [`account-form-modal.tsx:89`](../../src/presentation/components/accounts/account-form-modal.tsx#L89)

- `.trim()` en `name`/`currency` evita que valores de solo espacios pasen como válidos.
  [`account-form-modal.tsx:94`](../../src/presentation/components/accounts/account-form-modal.tsx#L94)

- `appendError` concatena en vez de sobrescribir cuando dos errores del servidor mapean al mismo campo.
  [`account-form-modal.tsx:60`](../../src/presentation/components/accounts/account-form-modal.tsx#L60)

**Seguridad ante condiciones de carrera**

- `openRef` evita side-effects (toast/cierre/refresh) si el usuario ya cerró el modal antes de que resuelva el `await`.
  [`account-form-modal.tsx:141`](../../src/presentation/components/accounts/account-form-modal.tsx#L141)

- `deletingId` bloquea eliminar dos veces la misma cuenta por doble click y deshabilita el botón de esa fila.
  [`page.tsx:81`](../../src/app/accounts/page.tsx#L81)

**Estados de error/vacío**

- `loadError` distingue "falló la carga" de "no hay cuentas" — antes ambos casos mostraban el mismo empty state.
  [`page.tsx:177`](../../src/app/accounts/page.tsx#L177)

**Fallback de tipo de cuenta**

- `getAccountTypeInfo` como fallback evita que el `Select` quede sin opción coincidida ante un `type` legacy/desconocido.
  [`account-form-modal.tsx:39`](../../src/presentation/components/accounts/account-form-modal.tsx#L39)

**Integración de navegación**

- Nuevo item "Cuentas" hace la página descubrible en desktop.
  [`desktop-sidebar.tsx:12`](../../src/presentation/components/shared/desktop-sidebar.tsx#L12)

- Mismo item, consistente en mobile.
  [`mobile-nav.tsx:10`](../../src/presentation/components/shared/mobile-nav.tsx#L10)

**Periféricos**

- Metadata compartida de tipos de cuenta (emoji/label), consumida por página y modal.
  [`account-types.ts:9`](../../src/presentation/components/accounts/account-types.ts#L9)

- Barrel export de los nuevos componentes.
  [`index.ts:1`](../../src/presentation/components/accounts/index.ts#L1)
