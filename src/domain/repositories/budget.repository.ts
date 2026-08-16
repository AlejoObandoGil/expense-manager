import { Budget } from '@/domain/entities/budget';

export interface IBudgetRepository {
  getBudgetForCategory(categoryId: string, month: number, year: number): Promise<Budget | null>;
  createBudget(data: Omit<Budget, 'id' | 'remaining' | 'percentageUsed'>): Promise<Budget>;
  updateBudget(id: string, data: Partial<Omit<Budget, 'id'>>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;
  getAllBudgets(): Promise<Budget[]>;
}
