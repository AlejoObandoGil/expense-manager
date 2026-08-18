'use server';

import { z } from 'zod';
import { getBudgetRepository } from '@/infrastructure/repositories';
import { GetBudgetStatusUseCase, type BudgetStatus } from '@/domain/usecases/budgets';
import { Budget } from '@/domain/entities/budget';
import { ActionResult } from '@/lib/types';

// Zod schemas for input validation
const createBudgetSchema = z.object({
  categoryId: z.string().min(1, 'La categoría es requerida'),
  amount: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .finite('Debe ser un número válido'),
  month: z.number().min(1, 'El mes debe estar entre 1 y 12').max(12, 'El mes debe estar entre 1 y 12'),
  year: z.number().min(1900, 'El año es inválido'),
  spent: z.number().nonnegative('El gasto no puede ser negativo').optional().default(0),
});

const updateBudgetSchema = z.object({
  id: z.string().min(1, 'El ID del presupuesto es requerido'),
  amount: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .finite('Debe ser un número válido')
    .optional(),
  spent: z.number().nonnegative('El gasto no puede ser negativo').optional(),
});

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

/**
 * Creates a new budget for a specific category and month with validated input.
 */
export async function createBudget(input: unknown): Promise<ActionResult<Budget>> {
  try {
    const validatedData = createBudgetSchema.parse(input);
    const repository = await getBudgetRepository();
    const budget = await repository.createBudget({
      categoryId: validatedData.categoryId,
      amount: validatedData.amount,
      month: validatedData.month,
      year: validatedData.year,
      spent: validatedData.spent,
    });
    return { success: true, data: budget };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((issue) => issue.message).join('; ');
      return { success: false, error: message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error desconocido' };
  }
}

/**
 * Updates an existing budget with validated input.
 */
export async function updateBudget(input: unknown): Promise<ActionResult<Budget>> {
  try {
    const validatedData = updateBudgetSchema.parse(input);
    const { id, ...updateData } = validatedData;
    const repository = await getBudgetRepository();
    const budget = await repository.updateBudget(id, updateData);
    return { success: true, data: budget };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues.map((issue) => issue.message).join('; ');
      return { success: false, error: message };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error desconocido' };
  }
}

/**
 * Deletes a budget by ID.
 */
export async function deleteBudget(id: string): Promise<ActionResult<void>> {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID de presupuesto inválido' };
    }
    const repository = await getBudgetRepository();
    await repository.deleteBudget(id);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al eliminar el presupuesto' };
  }
}
