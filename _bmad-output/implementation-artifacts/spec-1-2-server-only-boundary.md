---
title: 'Story 1.2: Implement Server-Only Boundary with package server-only'
type: 'feature'
created: '2026-08-16'
status: 'done'
baseline_commit: 2b3fef7
implemented_by: john.obando.dev@gmail.com
completion_date: 2026-08-17
git_hash: 25c5b45
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Actualmente, archivos de infraestructura (`src/infrastructure/`) pueden ser importados accidentalmente desde componentes `'use client'`, violando el límite arquitectónico AD-2. Solo code review previene esto; necesitamos una barrera de build.

**Approach:** Agregar `import 'server-only'` como primera línea en cada archivo de infraestructura. Esto hace que cualquier importación desde cliente rompa el build inmediatamente, no solo el code review. Primero instalar el paquete `server-only` desde npm.

## Boundaries & Constraints

**Always:** 
- `import 'server-only'` debe ser la primera línea no-comentario en CADA archivo bajo `src/infrastructure/`
- Incluir: factory.ts, todos los mock-*.repository.ts, e index.ts
- El paquete `server-only` debe estar en dependencies (verificado en build)
- Cambios solo de adiciones; sin refactorización

**Ask First:**
- Ninguno para esta historia

**Never:**
- No remover o comentar imports existentes
- No cambiar la lógica de ningún archivo
- No modificar tests o build config
- No agregar server-only a archivos bajo src/presentation/, src/app/transactions/page.tsx, ni ningún client component

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Build from clean client import | Client component intenta `import { MockTransactionRepository } from '@/infrastructure'` | Build falla con error claro sobre server-only | N/A (error esperado) |
| Build from server action | Server action (use server) intenta `import factory from '@/infrastructure/repositories/factory'` | Build éxito; import permitido | N/A |
| Valid dev server startup | `npm run dev` después de instalar server-only | Dev server inicia sin errores | N/A (config correcta) |

</frozen-after-approval>

## Code Map

**Infraestructura (server-only guard):**
- `src/infrastructure/repositories/factory.ts` -- Punto único de instanciación; debe tener server-only guard
- `src/infrastructure/repositories/mock-transaction.repository.ts` -- Mock transacciones; debe tener server-only guard
- `src/infrastructure/repositories/mock-category.repository.ts` -- Mock categorías; debe tener server-only guard
- `src/infrastructure/repositories/mock-budget.repository.ts` -- Mock presupuestos; debe tener server-only guard
- `src/infrastructure/repositories/index.ts` -- Barrel export repositorios; debe tener server-only guard
- `src/infrastructure/data/categories.ts` -- Datos estáticos; debe tener server-only guard (cliente no importará directamente)
- `src/infrastructure/data/transactions.ts` -- Datos estáticos; debe tener server-only guard (cliente no importará directamente)
- `src/infrastructure/data/index.ts` -- Barrel export datos; debe tener server-only guard
- `package.json` -- Debe contener `"server-only": "^0.0.1"` en dependencies

**Server actions (bridge para cliente):**
- `src/app/actions/categories.ts` -- Crear nuevo: server action `getCategories()` que llama getCategoryRepository()
- `src/app/transactions/actions.ts` -- Verificar/agregar server action `getTransactions()` si falta

**Client pages (refactor para usar server actions):**
- `src/app/transactions/page.tsx` -- Reemplazar `import mockCategories` con llamada a server action getCategories()
- `src/app/categories/page.tsx` -- Reemplazar `import mockCategories` con llamada a server action getCategories()`

## Tasks & Acceptance

**Execution - Fase 1: Proteger infraestructura con server-only (8 archivos)**
- [ ] `src/infrastructure/repositories/factory.ts` -- Agregar `import 'server-only'` como primer import
- [ ] `src/infrastructure/repositories/mock-transaction.repository.ts` -- Agregar `import 'server-only'` como primer import
- [ ] `src/infrastructure/repositories/mock-category.repository.ts` -- Agregar `import 'server-only'` como primer import
- [ ] `src/infrastructure/repositories/mock-budget.repository.ts` -- Agregar `import 'server-only'` como primer import
- [ ] `src/infrastructure/repositories/index.ts` -- Agregar `import 'server-only'` como primer import
- [ ] `src/infrastructure/data/categories.ts` -- Agregar `import 'server-only'` como primer import
- [ ] `src/infrastructure/data/transactions.ts` -- Agregar `import 'server-only'` como primer import
- [ ] `src/infrastructure/data/index.ts` -- Agregar `import 'server-only'` como primer import

**Execution - Fase 2: Refactorizar cliente para usar server actions (YA EXISTEN)**
- [ ] `src/app/transactions/page.tsx` -- Reemplazar `import { mockCategories }` con llamada a server action `getCategories()` que ya existe en transactions/actions.ts -- Elimina violación de AD-2
- [ ] `src/app/categories/page.tsx` -- Reemplazar `import { mockCategories }` con llamada a server action `getCategories()` que ya existe en categories/actions.ts -- Elimina violación de AD-2

**Execution - Fase 3: Audit final**
- [ ] Ejecutar `grep -r '@/infrastructure' src/app --include='*.tsx'` -- Verificar que cero archivos con 'use client' importan desde @/infrastructure

**Acceptance Criteria:**
- **Given** se completan todas las fases, **when** se ejecuta `npm run build`, **then** compilación éxito sin errors sobre server-only
- **Given** existe un client component que intenta `import { mockCategories } from '@/infrastructure/data'`, **when** se ejecuta `npm run build`, **then** falla con error claro sobre server-only
- **Given** un server action importa desde `@/infrastructure`, **when** se ejecuta `npm run build`, **then** el import es permitido y compila éxito
- **Given** páginas acceden a categorías via server action getCategories(), **when** se verifica el flujo, **then** data fluye: client → server action → repository → data (respeta AD-2)
- **Given** `npx tsc --noEmit` se ejecuta, **then** pasa sin errores

## Spec Change Log

<!-- Append-only. Populated during review loops. -->

## Design Notes

**Cambio arquitectónico importante:**
Client components no importan data directamente. En su lugar:
1. Llamadas a server actions (getCategories, getTransactions)
2. Server actions wrappean acceso a repositorios
3. Infraestructura protegida con server-only en build time

Esto cierra completamente el boundary AD-2 — no es solo código review, es una garantía de build.

## Verification

**Commands:**
- `npm install` -- expected: server-only agregado a node_modules
- `npm run build` -- expected: build éxito sin errors sobre server-only
- `npx tsc --noEmit` -- expected: exit 0, sin errores de tipos
- `grep -r '@/infrastructure' src/app --include='*.tsx'` -- expected: cero matches (ningún client component importa @/infrastructure)

**Manual checks:**
- Verificar que `src/app/transactions/page.tsx` y `src/app/categories/page.tsx` no tienen `import { mockCategories }`
- Verificar que ambas páginas llaman `await getCategories()` via server action
- Verificar que server-only está en primeras líneas de todos los archivos bajo src/infrastructure/
