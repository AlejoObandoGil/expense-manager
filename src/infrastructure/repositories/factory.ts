import 'server-only';
import { ITransactionRepository } from '@/domain/repositories/transaction.repository';
import { ICategoryRepository } from '@/domain/repositories/category.repository';
import { IBudgetRepository } from '@/domain/repositories/budget.repository';
import { MockTransactionRepository } from './mock-transaction.repository';
import { MockCategoryRepository } from './mock-category.repository';
import { MockBudgetRepository } from './mock-budget.repository';
import { ApiTransactionRepository } from './api-transaction.repository';
import { ApiCategoryRepository } from './api-category.repository';
import { createServerClient } from '@/lib/supabase/server';

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
 * For api: returns a new instance per call (stateless), built with a
 * Supabase client authenticated for the current request. RLS on the
 * `transactions` table scopes every query to the caller — this repository
 * never receives or filters by `userId`.
 *
 * Signature is async to support auth/session resolution without breaking callers.
 *
 * For `api`, this relies on `createServerClient()` reading cookies via
 * `next/headers`, which requires request context (Server Action, Route
 * Handler, or Server Component render) — calling this from a cron job or
 * other background/out-of-request context will fail.
 */
export async function getTransactionRepository(): Promise<ITransactionRepository> {
  const dataSource = getDataSource();

  if (dataSource === 'mock') {
    if (!mockTransactionRepo) {
      mockTransactionRepo = new MockTransactionRepository();
    }
    return mockTransactionRepo;
  }

  const supabase = await createServerClient();
  return new ApiTransactionRepository(supabase);
}

/**
 * Retrieves or creates the CategoryRepository singleton.
 * For mock: returns cached singleton (state preserved across calls)
 * For api: returns a new instance per call (stateless), built with a
 * Supabase client authenticated for the current request. RLS on the
 * `categories` table scopes every query to the caller — this repository
 * never receives or filters by `userId`.
 *
 * Signature is async to support auth/session resolution without breaking callers.
 *
 * For `api`, this relies on `createServerClient()` reading cookies via
 * `next/headers`, which requires request context (Server Action, Route
 * Handler, or Server Component render) — calling this from a cron job or
 * other background/out-of-request context will fail.
 */
export async function getCategoryRepository(): Promise<ICategoryRepository> {
  const dataSource = getDataSource();

  if (dataSource === 'mock') {
    if (!mockCategoryRepo) {
      mockCategoryRepo = new MockCategoryRepository();
    }
    return mockCategoryRepo;
  }

  const supabase = await createServerClient();
  return new ApiCategoryRepository(supabase);
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
