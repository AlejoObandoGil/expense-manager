import { Account } from '@/domain/entities/account';

export interface IAccountRepository {
  findAll(): Promise<Account[]>;
  findById(id: string): Promise<Account | null>;
  findActive(): Promise<Account[]>;
  create(account: Omit<Account, 'id'>): Promise<Account>;
  update(id: string, account: Partial<Omit<Account, 'id'>>): Promise<Account>;
  delete(id: string): Promise<void>;
}
