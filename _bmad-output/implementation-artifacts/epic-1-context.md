---
compiled_at: 2026-08-16
planning_sources:
  - ARCHITECTURE-SPINE.md (Remediación Dominio/Infraestructura)
  - epics.md
---

# Epic 1 Context: Clean Architecture Foundation

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Establecer una arquitectura en capas completa y forzable con dependencias unidireccionales, factory pattern para instanciación de repositorios, boundary server-only para infraestructura, y consolidación de utilidades compartidas. Cierra la única grieta de diseño actual: hoy la dirección de dependencia solo se respeta en lectura; en escritura, `presentation` salta directo a `infrastructure`. Esto incluye arreglar convenciones de nombres de tipos (prefijo I), agregar `server-only` para forzar límites en build time, consolidar formatCurrency en un único home (`src/lib/`), y eliminar sistemas de diseño duplicados.

## Stories

- Story 1.1: Fix TransactionRepository Type Naming (Critical Blocker)
- Story 1.2: Implement Server-Only Boundary with package 'server-only'
- Story 1.3: Create Factory Pattern with Async Resolution
- Story 1.4: Consolidate Utilities & Remove Duplicate Design System

## Requirements & Constraints

**Functional:**
- Toda operación (lectura/escritura) debe fluir: `presentation → server action → usecase → interfaz de repositorio → infraestructura`
- Repositorios solo instanciables desde código `'use server'` (nunca desde `'use client'`)
- Validación de input en el boundary de server actions usando Zod antes de invocar usecases
- Generación de IDs usando `crypto.randomUUID()` en repositorios, no en usecases/presentation
- Moneda centralizada: `Intl.NumberFormat('es-PE', ...)` en `src/lib/format.ts`
- Design tokens únicos: `app/globals.css` es la única fuente

**Non-Functional:**
- Dominio sin dependencias de framework (TypeScript puro)
- Full TypeScript compilation sin errores: `npx tsc --noEmit` debe pasar
- Convenciones de nombres: repositorios con prefijo I, usecases con sufijo UseCase
- Serialización nativa de fechas (Date objects de extremo a extremo)
- Pattern de error: `ActionResult<T> = { success: true, data: T } | { success: false, error: string }`

## Technical Decisions

**Dependency Boundary (AD-1):**
- Unidireccional y forzada: `presentation → actions → usecases → interfaces → infrastructure`
- Ningún client component importa `@/infrastructure`

**Server-Only Boundary (AD-2):**
- Package `server-only` en cada archivo de infraestructura
- `import 'server-only'` como primera línea rompe build si se importa desde client
- Solo `app/**/actions.ts` puede instanciar repositorios

**Factory Pattern (AD-3):**
- `infrastructure/repositories/factory.ts` es el ÚNICO punto de instanciación
- Funciones async: `getTransactionRepository(): Promise<ITransactionRepository>`
- Selecciona mock/api según `DATA_SOURCE` env var
- Mock memoizado como singleton; real estateless
- Valor inválido de DATA_SOURCE lanza error en startup (fail-loud)

**Consolidación de Utilidades (AD-6):**
- `src/lib/format.ts` centraliza `formatCurrency` (elimina 3 copias en componentes)
- Elimina `src/presentation/styles/theme.css` duplicado
- `app/globals.css` única fuente de tokens

## Cross-Story Dependencies

Story 1.1 (Type naming) es bloqueador crítico — proyecto no compila sin ella.
Story 1.2 (server-only) refuerza Story 1.3 (factory) en el enforcement de límites.
Story 1.4 (consolidar utilidades) sin dependencias de otras; puede ejecutarse en paralelo.
