'use server';

import { getBudgetRepository } from '@/infrastructure/repositories';
import { GetBudgetStatusUseCase, type BudgetStatus } from '@/domain/usecases/budgets';
import { ActionResult } from '@/lib/types';

/**
 * Gets the budget status for a specific category and month.
 * Includes calculated fields: isNearLimit (> 80%), isOverBudget (> 100%)
 */
export async function getBudgetStatus(
  categoryId: string,
  month: number,
  year: number
): Promise<ActionResult<BudgetStatus>> {
  try {
    if (!categoryId) {
      return { success: false, error: 'La categoría es requerida' };
    }
    if (!month || month < 1 || month > 12) {
      return { success: false, error: 'El mes debe estar entre 1 y 12' };
    }
    if (!year || year < 1900) {
      return { success: false, error: 'El año es inválido' };
    }

    const repository = await getBudgetRepository();
    const useCase = new GetBudgetStatusUseCase(repository);
    const budget = await useCase.execute(categoryId, month, year);
    return { success: true, data: budget };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al obtener el estado del presupuesto' };
  }
}
