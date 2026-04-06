import { ITransactionRepository } from '@/domain/repositories/transaction.repository';
import { Transaction } from '@/domain/entities/transaction';
import { mockTransactions } from '@/infrastructure/data/transactions';

export class MockTransactionRepository implements ITransactionRepository {
  private transactions: Transaction[] = [...mockTransactions];

  async findAll(): Promise<Transaction[]> {
    return this.transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactions.find(t => t.id === id) || null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.transactions.filter(
      t => t.date >= startDate && t.date <= endDate
    );
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    return this.transactions.filter(t => t.categoryId === categoryId);
  }

  async findByType(type: 'income' | 'expense'): Promise<Transaction[]> {
    return this.transactions.filter(t => t.type === type);
  }

  async create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const transaction: Transaction = {
      ...data,
      id: `tx-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.transactions.push(transaction);
    return transaction;
  }

  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found');
    
    this.transactions[index] = {
      ...this.transactions[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.transactions[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.transactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found');
    this.transactions.splice(index, 1);
  }
}

export const transactionRepository = new MockTransactionRepository();
