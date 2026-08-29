'use server';

import { z } from 'zod';
import { getAccountRepository, getTransactionRepository } from '@/infrastructure/repositories';
import { Account } from '@/domain/entities/account';
import { ActionResult } from '@/lib/types';

const createAccountSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['credit_card', 'checking', 'savings', 'cash', 'investment']),
  initialBalance: z.number().finite('El saldo inicial debe ser un número válido').default(0),
  currency: z.string().min(1, 'La moneda es requerida'),
});

const updateAccountSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  name: z.string().min(1).optional(),
  type: z.enum(['credit_card', 'checking', 'savings', 'cash', 'investment']).optional(),
  initialBalance: z.number().finite().optional(),
  currency: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function getAccounts(): Promise<ActionResult<Account[]>> {
  try {
    const repository = await getAccountRepository();
    const accounts = await repository.findAll();
    return { success: true, data: accounts };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al obtener cuentas' };
  }
}

export async function getActiveAccounts(): Promise<ActionResult<Account[]>> {
  try {
    const repository = await getAccountRepository();
    const accounts = await repository.findActive();
    return { success: true, data: accounts };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al obtener cuentas activas' };
  }
}

export async function createAccount(input: unknown): Promise<ActionResult<Account>> {
  try {
    const validatedData = createAccountSchema.parse(input);
    const repository = await getAccountRepository();
    const account = await repository.create({
      ...validatedData,
      isActive: true,
    });
    return { success: true, data: account };
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

export async function updateAccount(input: unknown): Promise<ActionResult<Account>> {
  try {
    const validatedData = updateAccountSchema.parse(input);
    const { id, ...data } = validatedData;
    const repository = await getAccountRepository();
    const account = await repository.update(id, data);
    return { success: true, data: account };
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

export async function deleteAccount(id: string): Promise<ActionResult<void>> {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID de cuenta inválido' };
    }

    const transactionRepository = await getTransactionRepository();
    const associatedTransactions = await transactionRepository.findByAccount(id);

    if (associatedTransactions.length > 0) {
      const accountRepository = await getAccountRepository();
      await accountRepository.update(id, { isActive: false });
      return { success: true, data: undefined };
    }

    const accountRepository = await getAccountRepository();
    await accountRepository.delete(id);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error al eliminar la cuenta' };
  }
}
