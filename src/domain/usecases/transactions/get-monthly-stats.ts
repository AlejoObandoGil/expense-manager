import { TransactionRepository } from '@/domain/repositories';

export interface MonthlyStat {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export class GetMonthlyStatsUseCase {
  constructor(private repository: TransactionRepository) {}

  async execute(months: number = 6): Promise<MonthlyStat[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const transactions = await this.repository.findByDateRange(startDate, endDate);
    
    const stats = new Map<string, MonthlyStat>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!stats.has(key)) {
        stats.set(key, {
          month: key,
          income: 0,
          expense: 0,
          balance: 0
        });
      }
      
      const stat = stats.get(key)!;
      if (transaction.type === 'income') {
        stat.income += transaction.amount;
      } else {
        stat.expense += transaction.amount;
      }
      stat.balance = stat.income - stat.expense;
    });
    
    return Array.from(stats.values()).sort((a, b) => a.month.localeCompare(b.month));
  }
}
