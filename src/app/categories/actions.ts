'use server';

import { z } from 'zod';
import { getCategoryRepository } from '@/infrastructure/repositories';
import { Category } from '@/domain/entities/category';
import { ActionResult } from '@/lib/types';

// Zod schemas for input validation
const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es requerido'),
  emoji: z.string().min(1, 'El emoji es requerido'),
  color: z.string().min(1, 'El color es requerido'),
  type: z.enum(['income', 'expense', 'both']),
});

const updateCategorySchema = z.object({
  id: z.string().min(1, 'El ID de la categoría es requerido'),
  name: z.string().min(1, 'El nombre de la categoría es requerido'),
  emoji: z.string().min(1, 'El emoji es requerido'),
  color: z.string().min(1, 'El color es requerido'),
  type: z.enum(['income', 'expense', 'both']),
});

const getCategoriesByTypeSchema = z.object({
  type: z.enum(['income', 'expense', 'both']),
});

// Server actions

/**
 * Fetches all categories.
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
    const { id, ...updateData } = validatedData;
    const repository = await getCategoryRepository();
    const category = await repository.update(id, updateData);
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
 */
export async function deleteCategory(
  id: string
): Promise<ActionResult<void>> {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID de categoría inválido' };
    }
    const repository = await getCategoryRepository();
    await repository.delete(id);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al eliminar la categoría' };
  }
}

/**
 * Fetches categories by type with validated input.
 */
export async function getCategoriesByType(
  input: unknown
): Promise<ActionResult<Category[]>> {
  try {
    const validatedData = getCategoriesByTypeSchema.parse(input);
    const repository = await getCategoryRepository();
    const categories = await repository.findByType(validatedData.type);
    return { success: true, data: categories };
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
