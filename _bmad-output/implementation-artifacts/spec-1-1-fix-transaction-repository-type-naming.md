---
status: done
story_id: 1.1
epic: 1
implemented_by: john.obando.dev@gmail.com
completion_date: 2026-08-16
git_hash: 493295e
---

# Story 1.1: Fix TransactionRepository Type Naming (Critical Blocker)

## Summary
Corregir la convención de nombres de tipos del repositorio para que siga el patrón I-prefix en todas las interfaces de repositorio.

## Acceptance Criteria

### AC1: Identificar inconsistencia de nombres
- **Given** el proyecto tiene 4 usecases de transacciones importando `TransactionRepository` (que no existe)
- **When** se busca en la capa de dominio el nombre real de la interfaz del repositorio
- **Then** se encuentra exportada como `ITransactionRepository` desde `domain/repositories/transaction.repository.ts:3`
- **And** el desajuste de nombres causa que `npx tsc --noEmit` falle

### AC2: Actualizar todas las importaciones
- **Given** existe la violación de convención de nombres
- **When** se actualizan los 4 archivos de usecase (`create-transaction.ts`, `get-balance.ts`, `get-monthly-stats.ts`, `get-transactions.ts`)
- **Then** todas las importaciones cambian de `TransactionRepository` → `ITransactionRepository`
- **And** el proyecto compila sin errores: `npx tsc --noEmit` retorna exit 0

### AC3: Verificar convención aplicada
- **Given** ahora se cumple la convención de nombres
- **When** se inspeccionan todos los archivos de `domain/repositories/`
- **Then** cada interfaz de repositorio está prefijada con I: ITransactionRepository, ICategoryRepository, IBudgetRepository
- **And** ningún archivo de usecase importa una interfaz de repositorio sin el prefijo I

## Implementation Notes
- Archivos modificados:
  - src/domain/usecases/transactions/create-transaction.ts
  - src/domain/usecases/transactions/get-balance.ts
  - src/domain/usecases/transactions/get-monthly-stats.ts
  - src/domain/usecases/transactions/get-transactions.ts
- Verificado con: `npx tsc --noEmit`
- Cambios puramente de nombres, sin cambios funcionales

## Auto Run Result

Status: done
Completion Date: 2026-08-16
Git Commit: 493295e
