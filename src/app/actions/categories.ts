'use server';

import { z } from 'zod';
import { getCategoryRepository, getTransactionRepository } from '@/infrastructure/repositories';
import { Category } from '@/domain/entities/category';
import { ActionResult } from '@/lib/types';

// Zod schemas for input validation
const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  emoji: z.string().min(1, 'El emoji es requerido'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido'),
  type: z.enum(['income', 'expense', 'both']),
});

const updateCategorySchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  emoji: z.string().min(1, 'El emoji es requerido'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido'),
  type: z.enum(['income', 'expense', 'both']),
});

// Server actions

/**
 * Fetches all categories via getCategoryRepository.
 * Respects AD-2: server action → repository → data flow.
 * Client components call this server action instead of importing @/infrastructure/data directly.
 */
export async function getCategories(): Promise<ActionResult<Category[]>> {
  try {
    const repository = await getCategoryRepository();
    const categories = await repository.findAll();
    return { success: true, data: categories };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al obtener categorías' };
  }
}

/**
 * Creates a new category with validated input.
 */
export async function createCategory(
  input: unknown
): Promise<ActionResult<Category>> {
  try {
    const validatedData = createCategorySchema.parse(input);
    const repository = await getCategoryRepository();
    const category = await repository.create(validatedData);
    return { success: true, data: category };
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
 * Updates an existing category with validated input.
 */
export async function updateCategory(
  input: unknown
): Promise<ActionResult<Category>> {
  try {
    const validatedData = updateCategorySchema.parse(input);
    const repository = await getCategoryRepository();
    const category = await repository.update(validatedData.id, validatedData);
    return { success: true, data: category };
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
 * Deletes a category by ID.
 *
 * Pre-deletion validation: checks that the category has no associated
 * transactions. If transactions exist, returns a specific error message
 * instead of allowing the database FK constraint to reject the delete.
 * This provides a better user experience and clearer error messaging.
 */
export async function deleteCategory(
  id: string
): Promise<ActionResult<void>> {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID de categoría inválido' };
    }

    // Check if category has associated transactions before attempting delete
    const transactionRepository = await getTransactionRepository();
    const associatedTransactions = await transactionRepository.findByCategory(id);

    if (associatedTransactions.length > 0) {
      return {
        success: false,
        error: 'Esta categoría tiene transacciones asociadas y no puede ser eliminada',
      };
    }

    // No transactions found; proceed with deletion
    const categoryRepository = await getCategoryRepository();
    await categoryRepository.delete(id);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al eliminar la categoría' };
  }
}
