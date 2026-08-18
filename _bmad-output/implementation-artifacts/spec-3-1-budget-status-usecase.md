---
status: done
story_id: 3.1
epic: 3
implemented_by: john.obando.dev@gmail.com
completion_date: 2026-08-16
git_hash: 5f9c7bd
---

# Story 3.1: Create GetBudgetStatusUseCase and IBudgetRepository

## Summary
Implementar GetBudgetStatusUseCase para centralizar el cálculo de estado de presupuesto (isNearLimit, isOverBudget, percentageUsed) en un único lugar de la capa de dominio.

## Acceptance Criteria

### AC1: Crear GetBudgetStatusUseCase
- **Given** no existe GetBudgetStatusUseCase actualmente
- **When** se crea `src/domain/usecases/budgets/get-budget-status.ts`
- **Then** exporta clase `GetBudgetStatusUseCase` que:
  - Constructor toma `IBudgetRepository` (inyectado)
  - Método: `execute(categoryId: string, month: number, year: number): Promise<BudgetStatus>`
  - Calcula: `percentageUsed`, `isNearLimit` (> 80%), `isOverBudget` (> 100%)

### AC2: Crear interfaz IBudgetRepository
- **Given** se crea GetBudgetStatusUseCase
- **When** se crea `src/domain/repositories/budget.repository.ts`
- **Then** exporta interfaz IBudgetRepository con métodos:
  - `getBudgetForCategory(categoryId: string, month: number, year: number): Promise<Budget | null>`
  - `createBudget(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget>`
  - `updateBudget(id: string, data: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Budget>`

### AC3: Implementar MockBudgetRepository
- **Given** la interfaz IBudgetRepository está definida
- **When** se crea `src/infrastructure/repositories/mock-budget.repository.ts`
- **Then** implementa IBudgetRepository con datos mock
- **And** la función `getBudgetRepository()` de la factory retorna una instancia de MockBudgetRepository

### AC4: Integración con server actions
- **Given** todos los componentes están en su lugar
- **When** un componente llama una server action para status de presupuesto
- **Then** la acción llama `getBudgetStatusUseCase.execute(categoryId, month, year)`
- **And** recibe objeto `BudgetStatus` pre-calculado con todos los campos computados
- **And** el componente ya no hardcodea lógica de presupuesto como `category.budget`, `percentageUsed`, etc.

## Implementation Notes
- Entity: `src/domain/entities/budget.ts` ya existe; reutilizar
- Modelo Budget debe tener: id, categoryId, amount, spent, month, year, createdAt, updatedAt
- Estructura de archivos:
  - `src/domain/repositories/budget.repository.ts` — interfaz IBudgetRepository
  - `src/domain/usecases/budgets/get-budget-status.ts` — usecase
  - `src/infrastructure/repositories/mock-budget.repository.ts` — implementación mock
  - Actualizar `src/infrastructure/repositories/factory.ts` para incluir `getBudgetRepository()`
- Coordinado con Story 2.2 para validación Zod de operaciones de presupuesto
- Reemplaza campo ad-hoc `category.budget` con entidad formal Budget

## Auto Run Result

Status: done
Completion Date: 2026-08-16
Git Commit: 5f9c7bd
Commits Related: f35d528, b23f7c9
