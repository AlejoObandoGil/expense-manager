import { Transaction } from '../entities/transaction';

export interface ITransactionRepository {
  findAll(): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  findByCategory(categoryId: string): Promise<Transaction[]>;
  findByType(type: 'income' | 'expense'): Promise<Transaction[]>;
  create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction>;
  update(id: string, transaction: Partial<Transaction>): Promise<Transaction>;
  delete(id: string): Promise<void>;
}
