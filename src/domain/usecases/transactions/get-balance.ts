import { TransactionRepository } from '@/domain/repositories';

export interface BalanceResult {
  income: number;
  expense: number;
  balance: number;
}

export class GetBalanceUseCase {
  constructor(private repository: TransactionRepository) {}

  async execute(): Promise<BalanceResult> {
    const transactions = await this.repository.findAll();
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }
}
