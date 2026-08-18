import { ITransactionRepository } from '@/domain/repositories';
import { Transaction } from '@/domain/entities/transaction';

export class CreateTransactionUseCase {
  constructor(private repository: ITransactionRepository) {}

  async execute(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    return this.repository.create(data);
  }
}
