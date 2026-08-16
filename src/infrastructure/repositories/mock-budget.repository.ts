import 'server-only';
import { IBudgetRepository } from '@/domain/repositories/budget.repository';
import { Budget } from '@/domain/entities/budget';

const mockBudgets: Budget[] = [
  {
    id: crypto.randomUUID(),
    categoryId: 'food-1',
    amount: 500,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    spent: 350,
    remaining: 150,
    percentageUsed: 70,
  },
  {
    id: crypto.randomUUID(),
    categoryId: 'transport-2',
    amount: 200,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    spent: 180,
    remaining: 20,
    percentageUsed: 90,
  },
  {
    id: crypto.randomUUID(),
    categoryId: 'entertainment-3',
    amount: 150,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    spent: 160,
    remaining: -10,
    percentageUsed: 107,
  },
];

export class MockBudgetRepository implements IBudgetRepository {
  private budgets: Budget[] = [...mockBudgets];

  async getBudgetForCategory(categoryId: string, month: number, year: number): Promise<Budget | null> {
    return (
      this.budgets.find(
        (b) => b.categoryId === categoryId && b.month === month && b.year === year
      ) || null
    );
  }

  async createBudget(
    data: Omit<Budget, 'id' | 'remaining' | 'percentageUsed'>
  ): Promise<Budget> {
    const budget: Budget = {
      ...data,
      id: crypto.randomUUID(),
      remaining: data.amount - data.spent,
      percentageUsed: (data.spent / data.amount) * 100,
    };
    this.budgets.push(budget);
    return budget;
  }

  async updateBudget(id: string, data: Partial<Omit<Budget, 'id'>>): Promise<Budget> {
    const index = this.budgets.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('Budget not found');

    const budget = this.budgets[index];
    const updated: Budget = {
      ...budget,
      ...data,
      remaining: data.amount ? data.amount - (data.spent ?? budget.spent) : budget.remaining,
      percentageUsed:
        data.amount || data.spent
          ? ((data.spent ?? budget.spent) / (data.amount ?? budget.amount)) * 100
          : budget.percentageUsed,
    };

    this.budgets[index] = updated;
    return updated;
  }

  async deleteBudget(id: string): Promise<void> {
    const index = this.budgets.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('Budget not found');
    this.budgets.splice(index, 1);
  }

  async getAllBudgets(): Promise<Budget[]> {
    return this.budgets;
  }
}
