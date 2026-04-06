import { TransactionRepository } from '@/domain/repositories';
import { Transaction } from '@/domain/entities/transaction';

export class GetTransactionsUseCase {
  constructor(private repository: TransactionRepository) {}

  async execute(): Promise<Transaction[]> {
    return this.repository.findAll();
  }

  async byDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.repository.findByDateRange(startDate, endDate);
  }

  async byCategory(categoryId: string): Promise<Transaction[]> {
    return this.repository.findByCategory(categoryId);
  }

  async byType(type: 'income' | 'expense'): Promise<Transaction[]> {
    return this.repository.findByType(type);
  }
}
