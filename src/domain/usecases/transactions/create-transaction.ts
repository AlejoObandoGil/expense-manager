import { TransactionRepository } from '@/domain/repositories';
import { Transaction } from '@/domain/entities/transaction';

export class CreateTransactionUseCase {
  constructor(private repository: TransactionRepository) {}

  async execute(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    return this.repository.create(data);
  }
}
