import 'server-only';
import { ITransactionRepository } from '@/domain/repositories/transaction.repository';
import { ICategoryRepository } from '@/domain/repositories/category.repository';
import { IBudgetRepository } from '@/domain/repositories/budget.repository';
import { MockTransactionRepository } from './mock-transaction.repository';
import { MockCategoryRepository } from './mock-category.repository';
import { MockBudgetRepository } from './mock-budget.repository';

type DataSource = 'mock' | 'api';

// Singleton instances for mock repositories (preserved across server action calls)
let mockTransactionRepo: MockTransactionRepository | null = null;
let mockCategoryRepo: MockCategoryRepository | null = null;
let mockBudgetRepo: MockBudgetRepository | null = null;

/**
 * Gets the data source configuration from environment.
 * Validates that the value is recognized and fails loudly if not.
 */
function getDataSource(): DataSource {
  const dataSource = (process.env.DATA_SOURCE || 'mock').toLowerCase() as DataSource;

  if (dataSource !== 'mock' && dataSource !== 'api') {
    throw new Error(
      `Invalid DATA_SOURCE environment variable: "${dataSource}". ` +
      `Expected "mock" or "api". This error is caught at startup to prevent silent fallback behavior.`
    );
  }

  return dataSource;
}

/**
 * Retrieves or creates the TransactionRepository singleton.
 * For mock: returns cached singleton (state preserved across calls)
 * For api: would return new instance (stateless, for real backend)
 *
 * Signature is async to support future auth/session resolution without breaking callers.
 */
export async function getTransactionRepository(): Promise<ITransactionRepository> {
  const dataSource = getDataSource();

  if (dataSource === 'mock') {
    if (!mockTransactionRepo) {
      mockTransactionRepo = new MockTransactionRepository();
    }
    return mockTransactionRepo;
  }

  // Future: return new ApiTransactionRepository()
  throw new Error('API data source not yet implemented');
}

/**
 * Retrieves or creates the CategoryRepository singleton.
 * For mock: returns cached singleton (state preserved across calls)
 * For api: would return new instance (stateless, for real backend)
 *
 * Signature is async to support future auth/session resolution without breaking callers.
 */
export async function getCategoryRepository(): Promise<ICategoryRepository> {
  const dataSource = getDataSource();

  if (dataSource === 'mock') {
    if (!mockCategoryRepo) {
      mockCategoryRepo = new MockCategoryRepository();
    }
    return mockCategoryRepo;
  }

  // Future: return new ApiCategoryRepository()
  throw new Error('API data source not yet implemented');
}

/**
 * Retrieves or creates the BudgetRepository singleton.
 * For mock: returns cached singleton (state preserved across calls)
 * For api: would return new instance (stateless, for real backend)
 *
 * Signature is async to support future auth/session resolution without breaking callers.
 */
export async function getBudgetRepository(): Promise<IBudgetRepository> {
  const dataSource = getDataSource();

  if (dataSource === 'mock') {
    if (!mockBudgetRepo) {
      mockBudgetRepo = new MockBudgetRepository();
    }
    return mockBudgetRepo;
  }

  // Future: return new ApiBudgetRepository()
  throw new Error('API data source not yet implemented');
}
