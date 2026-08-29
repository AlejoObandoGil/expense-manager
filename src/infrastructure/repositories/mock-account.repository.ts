import 'server-only';
import { IAccountRepository } from '@/domain/repositories/account.repository';
import { Account } from '@/domain/entities/account';
import { mockAccounts } from '@/infrastructure/data/accounts';

export class MockAccountRepository implements IAccountRepository {
  private accounts: Account[] = [...mockAccounts];

  async findAll(): Promise<Account[]> {
    return this.accounts;
  }

  async findById(id: string): Promise<Account | null> {
    return this.accounts.find(a => a.id === id) || null;
  }

  async findActive(): Promise<Account[]> {
    return this.accounts.filter(a => a.isActive);
  }

  async create(data: Omit<Account, 'id'>): Promise<Account> {
    const account: Account = {
      ...data,
      id: crypto.randomUUID(),
    };
    this.accounts.push(account);
    return account;
  }

  async update(id: string, data: Partial<Omit<Account, 'id'>>): Promise<Account> {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Account not found');

    this.accounts[index] = {
      ...this.accounts[index],
      ...data,
    };
    return this.accounts[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.accounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Account not found');
    this.accounts.splice(index, 1);
  }
}
