import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { IBudgetRepository } from '@/domain/repositories/budget.repository';
import { Budget } from '@/domain/entities/budget';

const TABLE = 'budgets';

/**
 * Shape of a `budgets` row as returned by Postgres. Kept local (rather than
 * importing the generated `Database` type) so this repository doesn't
 * depend on `database.types.ts` staying perfectly in sync with the schema
 * beyond these columns.
 *
 * `remaining` and `percentageUsed` have no equivalent column here — they are
 * derived fields, computed by `toDomain()` from `amount`/`spent` after
 * insert/update, never persisted (see Design Notes in
 * spec-4-4-persist-budgets-via-supabase-with-rls.md).
 */
interface BudgetRow {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  spent: number;
  month: number;
  year: number;
}

function toDomain(row: BudgetRow): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    amount: row.amount,
    month: row.month,
    year: row.year,
    spent: row.spent,
    remaining: row.amount - row.spent,
    percentageUsed: (row.spent / row.amount) * 100,
  };
}

/**
 * Supabase-backed implementation of `IBudgetRepository`.
 *
 * Row-level security on `budgets` scopes every query to the caller's own
 * rows via `auth.uid()`, so no method here accepts or filters by `userId` —
 * isolation is entirely a Postgres concern. `error` results from
 * supabase-js are always translated into curated `Error`s; the raw
 * `error.message` is never surfaced to callers. Each method also wraps its
 * supabase-js call in try/catch: a native exception (timeout, DNS, network
 * failure) resolves as a thrown error rather than a `{data, error}` result,
 * so without this the raw exception would otherwise escape untranslated.
 */
export class ApiBudgetRepository implements IBudgetRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getBudgetForCategory(categoryId: string, month: number, year: number): Promise<Budget | null> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .eq('category_id', categoryId)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle());
    } catch {
      throw new Error('No se pudo obtener el presupuesto.');
    }

    if (error) {
      throw new Error('No se pudo obtener el presupuesto.');
    }
    return data ? toDomain(data as BudgetRow) : null;
  }

  async createBudget(data: Omit<Budget, 'id' | 'remaining' | 'percentageUsed'>): Promise<Budget> {
    let row, error;
    try {
      ({ data: row, error } = await this.supabase
        .from(TABLE)
        .insert({
          category_id: data.categoryId,
          amount: data.amount,
          spent: data.spent,
          month: data.month,
          year: data.year,
        })
        .select('*')
        .single());
    } catch {
      throw new Error('No se pudo crear el presupuesto.');
    }

    if (error) {
      if (error.code === '23505') {
        throw new Error('Ya existe un presupuesto para esa categoría en ese mes y año.');
      }
      throw new Error('No se pudo crear el presupuesto.');
    }
    return toDomain(row as BudgetRow);
  }

  async updateBudget(id: string, data: Partial<Omit<Budget, 'id'>>): Promise<Budget> {
    const patch: Record<string, unknown> = {};
    if (data.categoryId !== undefined) patch.category_id = data.categoryId;
    if (data.amount !== undefined) patch.amount = data.amount;
    if (data.spent !== undefined) patch.spent = data.spent;
    if (data.month !== undefined) patch.month = data.month;
    if (data.year !== undefined) patch.year = data.year;

    if (Object.keys(patch).length === 0) {
      throw new Error('No hay cambios para actualizar.');
    }

    let row, error;
    try {
      ({ data: row, error } = await this.supabase
        .from(TABLE)
        .update(patch)
        .eq('id', id)
        .select('*')
        .single());
    } catch {
      throw new Error('No se pudo actualizar el presupuesto.');
    }

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Presupuesto no encontrado.');
      }
      if (error.code === '23505') {
        throw new Error('Ya existe un presupuesto para esa categoría en ese mes y año.');
      }
      throw new Error('No se pudo actualizar el presupuesto.');
    }
    return toDomain(row as BudgetRow);
  }

  async deleteBudget(id: string): Promise<void> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .delete()
        .eq('id', id)
        .select('id'));
    } catch {
      throw new Error('No se pudo eliminar el presupuesto.');
    }

    if (error) {
      throw new Error('No se pudo eliminar el presupuesto.');
    }
    if (!data || data.length === 0) {
      throw new Error('Presupuesto no encontrado.');
    }
  }

  async getAllBudgets(): Promise<Budget[]> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false }));
    } catch {
      throw new Error('No se pudieron obtener los presupuestos.');
    }

    if (error) {
      throw new Error('No se pudieron obtener los presupuestos.');
    }
    return (data as BudgetRow[]).map(toDomain);
  }
}
