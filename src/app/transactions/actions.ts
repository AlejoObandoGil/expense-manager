'use server';

import { z } from 'zod';
import { getTransactionRepository } from '@/infrastructure/repositories';
import {
  CreateTransactionUseCase,
  GetTransactionsUseCase,
  GetBalanceUseCase,
  GetMonthlyStatsUseCase,
} from '@/domain/usecases/transactions';
import { Transaction } from '@/domain/entities/transaction';
import { ActionResult } from '@/lib/types';

// Zod schemas for input validation
const createTransactionSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .finite('El monto debe ser un número válido'),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  date: z.coerce.date().refine(
    (date) => date <= new Date(),
    'La fecha no puede ser en el futuro'
  ),
  accountId: z.string().min(1, 'La cuenta es requerida'),
});

const updateTransactionSchema = z.object({
  id: z.string().min(1, 'El ID de la transacción es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .finite('El monto debe ser un número válido'),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  date: z.coerce.date().refine(
    (date) => date <= new Date(),
    'La fecha no puede ser en el futuro'
  ),
});

const getTransactionsByDateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const getTransactionsByCategorySchema = z.object({
  categoryId: z.string().min(1, 'La categoría es requerida'),
});

const getTransactionsByTypeSchema = z.object({
  type: z.enum(['income', 'expense']),
});

// Server actions

/**
 * Creates a new transaction with validated input.
 * Validates with Zod before passing to usecase.
 */
export async function createTransaction(
  input: unknown
): Promise<ActionResult<Transaction>> {
  try {
    const validatedData = createTransactionSchema.parse(input);
    const repository = await getTransactionRepository();
    const useCase = new CreateTransactionUseCase(repository);
    const transaction = await useCase.execute(validatedData);
    return { success: true, data: transaction };
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
 * Fetches all transactions.
 */
export async function getTransactions(): Promise<ActionResult<Transaction[]>> {
  try {
    const repository = await getTransactionRepository();
    const useCase = new GetTransactionsUseCase(repository);
    const transactions = await useCase.execute();
    return { success: true, data: transactions };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al obtener transacciones' };
  }
}

/**
 * Fetches transactions by date range with validated input.
 */
export async function getTransactionsByDateRange(
  input: unknown
): Promise<ActionResult<Transaction[]>> {
  try {
    const validatedData = getTransactionsByDateRangeSchema.parse(input);
    const repository = await getTransactionRepository();
    const useCase = new GetTransactionsUseCase(repository);
    const transactions = await useCase.byDateRange(
      validatedData.startDate,
      validatedData.endDate
    );
    return { success: true, data: transactions };
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
 * Fetches transactions by category with validated input.
 */
export async function getTransactionsByCategory(
  input: unknown
): Promise<ActionResult<Transaction[]>> {
  try {
    const validatedData = getTransactionsByCategorySchema.parse(input);
    const repository = await getTransactionRepository();
    const useCase = new GetTransactionsUseCase(repository);
    const transactions = await useCase.byCategory(validatedData.categoryId);
    return { success: true, data: transactions };
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
 * Fetches transactions by type with validated input.
 */
export async function getTransactionsByType(
  input: unknown
): Promise<ActionResult<Transaction[]>> {
  try {
    const validatedData = getTransactionsByTypeSchema.parse(input);
    const repository = await getTransactionRepository();
    const useCase = new GetTransactionsUseCase(repository);
    const transactions = await useCase.byType(validatedData.type);
    return { success: true, data: transactions };
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
 * Gets the current balance (income - expenses).
 */
export async function getBalance(): Promise<
  ActionResult<{
    income: number;
    expense: number;
    balance: number;
  }>
> {
  try {
    const repository = await getTransactionRepository();
    const useCase = new GetBalanceUseCase(repository);
    const balance = await useCase.execute();
    return { success: true, data: balance };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al calcular el balance' };
  }
}

/**
 * Gets monthly statistics for the specified number of months.
 */
export async function getMonthlyStats(
  months?: number
): Promise<
  ActionResult<
    Array<{
      month: string;
      income: number;
      expense: number;
      balance: number;
    }>
  >
> {
  try {
    const repository = await getTransactionRepository();
    const useCase = new GetMonthlyStatsUseCase(repository);
    const stats = await useCase.execute(months);
    return { success: true, data: stats };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al obtener estadísticas' };
  }
}

/**
 * Updates an existing transaction with validated input.
 */
export async function updateTransaction(
  input: unknown
): Promise<ActionResult<Transaction>> {
  try {
    const validatedData = updateTransactionSchema.parse(input);
    const repository = await getTransactionRepository();
    const transaction = await repository.update(validatedData.id, validatedData);
    return { success: true, data: transaction };
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
 * Deletes a transaction by ID.
 */
export async function deleteTransaction(
  id: string
): Promise<ActionResult<void>> {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID de transacción inválido' };
    }
    const repository = await getTransactionRepository();
    await repository.delete(id);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al eliminar la transacción' };
  }
}
