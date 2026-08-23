import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ICategoryRepository } from '@/domain/repositories/category.repository';
import { Category } from '@/domain/entities/category';

const TABLE = 'categories';

/**
 * Shape of a `categories` row as returned by Postgres. Kept local (rather
 * than importing the generated `Database` type) so this repository doesn't
 * depend on `database.types.ts` staying perfectly in sync with the schema
 * beyond these columns.
 */
interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'income' | 'expense' | 'both';
}

function toDomain(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    type: row.type,
  };
}

/**
 * Supabase-backed implementation of `ICategoryRepository`.
 *
 * Row-level security on `categories` scopes every query to the caller's own
 * rows via `auth.uid()`, so no method here accepts or filters by `userId` —
 * isolation is entirely a Postgres concern. `error` results from
 * supabase-js are always translated into curated `Error`s; the raw
 * `error.message` is never surfaced to callers. Each method also wraps its
 * supabase-js call in try/catch: a native exception (timeout, DNS, network
 * failure) resolves as a thrown error rather than a `{data, error}` result,
 * so without this the raw exception would otherwise escape untranslated.
 *
 * `Category.budget` has no equivalent column here (out of scope for this
 * story) — it is never read from or written to `categories`, so it is
 * always `undefined` on rows returned by this repository.
 */
export class ApiCategoryRepository implements ICategoryRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(): Promise<Category[]> {
    let data, error;
    try {
      ({ data, error } = await this.supabase.from(TABLE).select('*'));
    } catch {
      throw new Error('No se pudieron obtener las categorías.');
    }

    if (error) {
      throw new Error('No se pudieron obtener las categorías.');
    }
    return (data as CategoryRow[]).map(toDomain);
  }

  async findById(id: string): Promise<Category | null> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle());
    } catch {
      throw new Error('No se pudo obtener la categoría.');
    }

    if (error) {
      throw new Error('No se pudo obtener la categoría.');
    }
    return data ? toDomain(data as CategoryRow) : null;
  }

  async findByType(type: 'income' | 'expense' | 'both'): Promise<Category[]> {
    let data, error;
    try {
      // Mirrors `MockCategoryRepository.findByType()`: requesting 'income' or
      // 'expense' also returns 'both' categories (e.g. "Transferencia"), so
      // the two implementations of `ICategoryRepository` agree on the same
      // contract. Only an exact `type === 'both'` query stays a plain `.eq`.
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .in('type', type === 'both' ? ['both'] : [type, 'both']));
    } catch {
      throw new Error('No se pudieron obtener las categorías por tipo.');
    }

    if (error) {
      throw new Error('No se pudieron obtener las categorías por tipo.');
    }
    return (data as CategoryRow[]).map(toDomain);
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .insert({
          name: category.name,
          emoji: category.emoji,
          color: category.color,
          type: category.type,
        })
        .select('*')
        .single());
    } catch {
      throw new Error('No se pudo crear la categoría.');
    }

    if (error) {
      throw new Error('No se pudo crear la categoría.');
    }
    return toDomain(data as CategoryRow);
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    const patch: Record<string, unknown> = {};
    if (category.name !== undefined) patch.name = category.name;
    if (category.emoji !== undefined) patch.emoji = category.emoji;
    if (category.color !== undefined) patch.color = category.color;
    if (category.type !== undefined) patch.type = category.type;

    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .update(patch)
        .eq('id', id)
        .select('*')
        .single());
    } catch {
      throw new Error('No se pudo actualizar la categoría.');
    }

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Categoría no encontrada.');
      }
      throw new Error('No se pudo actualizar la categoría.');
    }
    return toDomain(data as CategoryRow);
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
      throw new Error('No se pudo eliminar la categoría.');
    }

    if (error) {
      throw new Error('No se pudo eliminar la categoría.');
    }
    if (!data || data.length === 0) {
      throw new Error('Categoría no encontrada.');
    }
  }
}
