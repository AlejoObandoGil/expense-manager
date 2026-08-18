---
title: 'Story 3.2: Replace Inline Budget Calculations in Components'
type: 'refactor'
created: '2026-08-17'
status: 'done'
baseline_commit: 25c5b453932a7d38b39d69c1ff65f2e737dcc04f
implemented_by: john.obando.dev@gmail.com
completion_date: 2026-08-17
git_hash: b854013
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Componentes contienen lógica de presupuesto inline (cálculos de porcentaje, isOverBudget, variación mensual). Esto viola AD-5 (estado derivado vive en usecases) y genera duplicación/inconsistencia entre components/pages.

**Approach:** Refactorizar componentes para consumir resultados pre-calculados de GetBudgetStatusUseCase (creado en Story 3.1). Eliminar toda aritmética de presupuesto; confiar en server actions.

## Boundaries & Constraints

**Always:**
- Eliminar TODOS los cálculos inline: `(spent / budget) * 100`, `spent > budget`, etc.
- Usar GetBudgetStatusUseCase en lugar de math directo
- No crear nuevos usecases; usar el existente de Story 3.1
- Cambios solo en presentación/pages; sin tocar dominio/infraestructura

**Ask First:**
- Nada

**Never:**
- No agregar nuevas librerías de Math o utilidades
- No refactorizar componentes que usen GetBudgetStatusUseCase (ya correcto)
- No cambiar firma de GetBudgetStatusUseCase

</frozen-after-approval>

## Code Map

**Archivos a refactorizar (contienen cálculos inline):**
- `src/app/categories/page.tsx` -- líneas 11-26, 52-54: calcula percentageUsed, isOverBudget inline; usa mockCategories.map() con lógica de presupuesto
- `src/presentation/components/dashboard-stats.tsx` -- líneas 63, 70, 77, 84: hardcodea variación "vs mes anterior", percentages
- `src/presentation/components/category-chart.tsx` -- cálculos de presupuesto en render

**Infraestructura (usar, no refactorizar):**
- `src/domain/usecases/budgets/get-budget-status.ts` (Story 3.1) -- ya calcula: percentageUsed, isNearLimit (>80%), isOverBudget (>100%)
- `src/app/budgets/actions.ts` -- server action que orquesta GetBudgetStatusUseCase (si existe; verificar)

## Tasks & Acceptance

**Execution:**
- [ ] `src/app/categories/page.tsx` -- Remover lógica inline `(spent / budget) * 100`, `spent > budget`; consumir `budgetStatus` precalculado de usecase -- Respeta AD-5
- [ ] `src/presentation/components/dashboard-stats.tsx` -- Remover cálculos de variación monthly hardcodeados; recibir valores pre-calculados como props -- Respeta AD-5
- [ ] `src/presentation/components/category-chart.tsx` -- Remover cálculos de presupuesto inline; confiar en datos ya calculados -- Respeta AD-5
- [ ] Verificar que ningún componente hace aritmética de presupuesto: `grep -r '/ budget\|spent >\|percentageUsed\s*=' src/presentation --include='*.tsx'` retorna cero -- Audit

**Acceptance Criteria:**
- **Given** un componente accede a presupuesto, **when** inspecciona el código, **then** no contiene cálculos inline (no hay división, comparación manual)
- **Given** GetBudgetStatusUseCase está implementado, **when** componentes lo usan, **then** reciben valores pre-calculados sin duplicar lógica
- **Given** `npm run build` se ejecuta, **then** éxito y sin warnings
- **Given** `grep -r 'percentageUsed\s*=' src/presentation` se ejecuta, **then** retorna cero matches (sin asignación manual)

## Spec Change Log

## Design Notes

**Por qué esto importa:**
- AD-5 requiere: estado derivado vive en usecases, no en components
- Hoy: 3+ componentes duplican lógica de presupuesto → inconsistencia
- Solución: Delegar toda aritmética a GetBudgetStatusUseCase; componentes solo consumen

**Ejemplo transformación:**
```typescript
// ANTES (categories/page.tsx)
const categoriesWithSpending = mockCategories.map(cat => ({
  spent: expensesByCategory.get(cat.id) || 0,
  budget: cat.budget || 1000,
  percentageUsed: (spent / budget) * 100,  // ← ELIMINAR
  isOverBudget: spent > budget,            // ← ELIMINAR
}));

// DESPUÉS
const budgetStatus = await getBudgetStatus(categoryId, month, year);
// Component solo usa: budgetStatus.percentageUsed, budgetStatus.isOverBudget
```

## Verification

**Commands:**
- `npm run build` -- expected: éxito sin errors
- `grep -r '/ budget\|spent >\|percentageUsed\s*=' src/presentation --include='*.tsx'` -- expected: cero matches
- `grep -r 'isOverBudget\s*=' src/presentation --include='*.tsx'` -- expected: cero matches (asignación manual)

**Manual checks:**
- Verificar que `src/app/categories/page.tsx` no hace cálculos; solo llama server action
- Verificar que `dashboard-stats.tsx` recibe props pre-calculados
- Verificar que `category-chart.tsx` consume datos sin aritmética
