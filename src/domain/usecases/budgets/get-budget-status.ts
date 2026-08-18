import { IBudgetRepository } from '@/domain/repositories/budget.repository';
import { Budget } from '@/domain/entities/budget';

export interface BudgetStatus extends Budget {
  isNearLimit: boolean;
  isOverBudget: boolean;
}

export class GetBudgetStatusUseCase {
  constructor(private repository: IBudgetRepository) {}

  async execute(categoryId: string, month: number, year: number): Promise<BudgetStatus> {
    const budget = await this.repository.getBudgetForCategory(categoryId, month, year);

    if (!budget) {
      throw new Error(`Budget not found for category ${categoryId} in ${month}/${year}`);
    }

    return {
      ...budget,
      isNearLimit: budget.percentageUsed > 80,
      isOverBudget: budget.percentageUsed > 100,
    };
  }
}
