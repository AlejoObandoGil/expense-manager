import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { IAccountRepository } from '@/domain/repositories/account.repository';
import { Account } from '@/domain/entities/account';

const TABLE = 'accounts';

interface AccountRow {
  id: string;
  user_id: string;
  name: string;
  type: 'credit_card' | 'checking' | 'savings' | 'cash' | 'investment';
  initial_balance: number;
  currency: string;
  is_active: boolean;
}

function toDomain(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    initialBalance: row.initial_balance,
    currency: row.currency,
    isActive: row.is_active,
  };
}

export class ApiAccountRepository implements IAccountRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(): Promise<Account[]> {
    let data, error;
    try {
      ({ data, error } = await this.supabase.from(TABLE).select('*'));
    } catch {
      throw new Error('No se pudieron obtener las cuentas.');
    }

    if (error) {
      throw new Error('No se pudieron obtener las cuentas.');
    }
    return (data as AccountRow[]).map(toDomain);
  }

  async findById(id: string): Promise<Account | null> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle());
    } catch {
      throw new Error('No se pudo obtener la cuenta.');
    }

    if (error) {
      throw new Error('No se pudo obtener la cuenta.');
    }
    return data ? toDomain(data as AccountRow) : null;
  }

  async findActive(): Promise<Account[]> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .select('*')
        .eq('is_active', true));
    } catch {
      throw new Error('No se pudieron obtener las cuentas activas.');
    }

    if (error) {
      throw new Error('No se pudieron obtener las cuentas activas.');
    }
    return (data as AccountRow[]).map(toDomain);
  }

  async create(account: Omit<Account, 'id'>): Promise<Account> {
    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .insert({
          name: account.name,
          type: account.type,
          initial_balance: account.initialBalance,
          currency: account.currency,
          is_active: account.isActive,
        })
        .select('*')
        .single());
    } catch {
      throw new Error('No se pudo crear la cuenta.');
    }

    if (error) {
      throw new Error('No se pudo crear la cuenta.');
    }
    return toDomain(data as AccountRow);
  }

  async update(id: string, account: Partial<Omit<Account, 'id'>>): Promise<Account> {
    const patch: Record<string, unknown> = {};
    if (account.name !== undefined) patch.name = account.name;
    if (account.type !== undefined) patch.type = account.type;
    if (account.initialBalance !== undefined) patch.initial_balance = account.initialBalance;
    if (account.currency !== undefined) patch.currency = account.currency;
    if (account.isActive !== undefined) patch.is_active = account.isActive;

    if (Object.keys(patch).length === 0) {
      throw new Error('No hay cambios para actualizar.');
    }

    let data, error;
    try {
      ({ data, error } = await this.supabase
        .from(TABLE)
        .update(patch)
        .eq('id', id)
        .select('*')
        .single());
    } catch {
      throw new Error('No se pudo actualizar la cuenta.');
    }

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Cuenta no encontrada.');
      }
      throw new Error('No se pudo actualizar la cuenta.');
    }
    return toDomain(data as AccountRow);
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
      throw new Error('No se pudo eliminar la cuenta.');
    }

    if (error) {
      throw new Error('No se pudo eliminar la cuenta.');
    }
    if (!data || data.length === 0) {
      throw new Error('Cuenta no encontrada.');
    }
  }
}
