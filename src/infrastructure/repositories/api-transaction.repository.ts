import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ITransactionRepository } from '@/domain/repositories/transaction.repository';
import { Transaction } from '@/domain/entities/transaction';

const TABLE = 'transactions';

/**
 * Shape of a `transactions` row as returned by Postgres. Kept local (rather
 * than importing the generated `Database` type) so this repository doesn't
 * depend on `database.types.ts` staying perfectly in sync with the schema
 * beyond these columns.
 */
interface TransactionRow {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_id: string;
  account_id: string;
  date: string;
  type: 'income' | 'expense';
  created_at: string;
  updated_at: string;
}

function toDomain(row: TransactionRow): Transaction {
  return {
    id: row.id,
    amount: row.amount,
    description: row.description,
    categoryId: row.category_id,
    accountId: row.account_id,
    date: new Date(row.date),
    type: row.type,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Supabase-backed implementation of `ITransactionRepository`.
 *
 * Row-level security on `transactions` scopes every query to the caller's
 * own rows via `auth.uid()`, so no method here accepts or filters by
 * `userId` — isolation is entirely a Postgres concern. `error` results from
 * supabase-js are always translated into curated `Error`s; the raw
 * `error.message` is never surfaced to callers. Each method also wraps its
 * supabase-js call in try/catch: a native exception (timeout, DNS, network
 * failure) resolves as a thrown error rather than a `{data, error}` result,
 * so without this the raw exception would otherwise escape untranslated.
 */
export class ApiTransactionRepository implements ITransactionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(): Promise<Transaction[]> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .order('date', { ascending: false }));
    } catch {
      throw new Error('No se pudieron obtener las transacciones.');
    }

    if (error) {
      throw new Error('No se pudieron obtener las transacciones.');
    }
    return (data as TransactionRow[]).map(toDomain);
  }

  async findById(id: string): Promise<Transaction | null> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle());
    } catch {
      throw new Error('No se pudo obtener la transacción.');
    }

    if (error) {
      throw new Error('No se pudo obtener la transacción.');
    }
    return data ? toDomain(data as TransactionRow) : null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: false }));
    } catch {
      throw new Error('No se pudieron obtener las transacciones por rango de fecha.');
    }

    if (error) {
      throw new Error('No se pudieron obtener las transacciones por rango de fecha.');
    }
    return (data as TransactionRow[]).map(toDomain);
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .eq('category_id', categoryId)
        .order('date', { ascending: false }));
    } catch {
      throw new Error('No se pudieron obtener las transacciones por categoría.');
    }

    if (error) {
      throw new Error('No se pudieron obtener las transacciones por categoría.');
    }
    return (data as TransactionRow[]).map(toDomain);
  }

  async findByAccount(accountId: string): Promise<Transaction[]> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .eq('account_id', accountId)
        .order('date', { ascending: false }));
    } catch {
      throw new Error('No se pudieron obtener las transacciones por cuenta.');
    }

    if (error) {
      throw new Error('No se pudieron obtener las transacciones por cuenta.');
    }
    return (data as TransactionRow[]).map(toDomain);
  }

  async findByType(type: 'income' | 'expense'): Promise<Transaction[]> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .eq('type', type)
        .order('date', { ascending: false }));
    } catch {
      throw new Error('No se pudieron obtener las transacciones por tipo.');
    }

    if (error) {
      throw new Error('No se pudieron obtener las transacciones por tipo.');
    }
    return (data as TransactionRow[]).map(toDomain);
  }

  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .insert({
          amount: transaction.amount,
          description: transaction.description,
          category_id: transaction.categoryId,
          account_id: transaction.accountId,
          date: transaction.date.toISOString(),
          type: transaction.type,
        })
        .select('*')
        .single());
    } catch {
      throw new Error('No se pudo crear la transacción.');
    }

    if (error) {
      throw new Error('No se pudo crear la transacción.');
    }
    return toDomain(data as TransactionRow);
  }

  async update(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    const patch: Record<string, unknown> = {};
    if (transaction.amount !== undefined) patch.amount = transaction.amount;
    if (transaction.description !== undefined) patch.description = transaction.description;
    if (transaction.categoryId !== undefined) patch.category_id = transaction.categoryId;
    if (transaction.accountId !== undefined) patch.account_id = transaction.accountId ?? null;
    if (transaction.date !== undefined) patch.date = transaction.date.toISOString();
    if (transaction.type !== undefined) patch.type = transaction.type;
    // Postgres only auto-refreshes `updated_at` on INSERT (`default now()`);
    // there is no trigger to bump it on UPDATE, so every edit must set it
    // explicitly to match `MockTransactionRepository.update()`'s behavior.
    patch.updated_at = new Date().toISOString();

    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .update(patch)
        .eq('id', id)
        .select('*')
        .single());
    } catch {
      throw new Error('No se pudo actualizar la transacción.');
    }

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Transacción no encontrada.');
      }
      throw new Error('No se pudo actualizar la transacción.');
    }
    return toDomain(data as TransactionRow);
  }

  async delete(id: string): Promise<void> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .delete()
        .eq('id', id)
        .select('id'));
    } catch {
      throw new Error('No se pudo eliminar la transacción.');
    }

    if (error) {
      throw new Error('No se pudo eliminar la transacción.');
    }
    if (!data || data.length === 0) {
      throw new Error('Transacción no encontrada.');
    }
  }
}
