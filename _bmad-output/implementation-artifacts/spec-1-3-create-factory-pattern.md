---
status: done
story_id: 1.3
epic: 1
implemented_by: john.obando.dev@gmail.com
completion_date: 2026-08-16
git_hash: dd81e13
---

# Story 1.3: Create Factory Pattern with Async Resolution

## Summary
Implementar el patrón de factory como punto único de resolución para la instanciación de todas las interfaces de repositorio, permitiendo cambiar entre backends mock y real modificando solo un lugar.

## Acceptance Criteria

### AC1: Crear módulo factory con funciones async
- **Given** no existe un módulo factory actualmente
- **When** se crea `src/infrastructure/repositories/factory.ts`
- **Then** exporta dos funciones async:
  - `getTransactionRepository(): Promise<ITransactionRepository>`
  - `getCategoryRepository(): Promise<ICategoryRepository>`
  - (Placeholder para el futuro: `getBudgetRepository(): Promise<IBudgetRepository>`)

### AC2: Resolver según variable de entorno DATA_SOURCE
- **Given** existe la factory con firma async
- **When** una server action llama `const repo = await getTransactionRepository()`
- **Then** recibe una instancia de MockTransactionRepository (si DATA_SOURCE=mock o no está) o ApiTransactionRepository (si DATA_SOURCE=api, futuro)

### AC3: Memoización de repositorios mock
- **Given** DATA_SOURCE='mock'
- **When** dos server actions llaman `getTransactionRepository()` en el mismo proceso Node
- **Then** reciben la misma instancia (estado compartido entre llamadas)
- **And** cambios hechos por una acción son visibles a la siguiente

### AC4: Validación de valores de DATA_SOURCE
- **Given** se intenta usar un valor inválido de DATA_SOURCE (ej: 'invalid')
- **When** la factory se inicializa
- **Then** lanza un error con mensaje: "Invalid DATA_SOURCE value: invalid. Expected 'mock' or 'api'."

## Implementation Notes
- Archivo: `src/infrastructure/repositories/factory.ts`
- Memoización mediante variable a nivel de módulo o weakmap por DATA_SOURCE
- Incluye comentarios jsdoc explicando por qué la firma async
- Variable de entorno: `process.env.DATA_SOURCE || 'mock'`
- Configurado para usar server-only boundary

## Auto Run Result

Status: done
Completion Date: 2026-08-16
Git Commit: dd81e13
